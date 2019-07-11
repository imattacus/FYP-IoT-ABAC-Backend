const express = require('express')
const db = require('sqlite')
const router = express.Router()
const Promise = require('bluebird')
const PAP = require('../accesscontrol/pap')
const authentication = require('../authentication');

let pol_admin = new PAP();

// Access routes contains all things to interact with the access control system, including groups and attributes
// /access/
//      - /groups POST (create new group provided name and userid for authentication)
//      - /groups GET (provided userid get all the groups that user is a part of)
//      - /groups/:groupID/devices GET (get all the devices that are a part of that group, again must provided userid to authenticate)
//      - /groups/:groupID/devices POST (add a device to a group)
//      - /groups/:groupID/users POST (add a user to a group)
//      - /groups/:groupID/users GET (get all the users that are a part of that group)
//      - /groups/:groupID/attributes POST (create a new custom attribute for this group)
//      - /groups/:groupID/attributes GET (get all the custom attributes defined for this group)
//      - /groups/:groupID/users/:userID/attributes POST (Give a user a custom attribute from this group, and assign a value)
//      - /groups/:groupID/users/:userID/attributes GET (Get all the attributes that this user has relevant to this group)
//      - /groups/:groupID/devices/:deviceID/attributes POST (Give a device a custom attribute from this group, and assign a value)
//      - /groups/:groupID/devices/:deviceID/attributes GET (Get all the attributes that this device has relevant to this group)

// /access/users/:userID/attributes GET (Get all of the users attributes across all groups also global attributes)
// /access/devices/:deviceID/attributes GET (Get all of the devices attributes across all groups also global attributes)

// /access/users/:userID/requests/ GET all the users requests
// /access/users/:userID/requests/:requestID POST accept or decline a request

// Create a new group, provided a name, current logged in user to be the groups admin - (from authorization header)
router.post('/groups', authentication.requireAuthenticated, (req, res) => {
    let newgroupid;
    Promise.resolve()
        .then(() => db.run("INSERT INTO Groups(name, admin) VALUES (?,?)", req.body.name, req.user.id, { Promise }))
        .then(cb => {
            newgroupid = cb.lastID;
            return db.run("INSERT INTO GroupSubscription(groupid,userid) VALUES (?,?)", newgroupid, req.user.id, { Promise });
        })
        .then(() => {return db.run("INSERT INTO AttributeDef(name, prettyname, datatype, groupid) VALUES (?,?,?,?)", `${newgroupid}_Member`, 'Member', 'boolean', newgroupid, { Promise })})
        .then(function(cb) {
            return db.run("INSERT INTO AttributeValue(attrid, value, appliesto, userid) VALUES (?,?,?,?)", cb.lastID, 'true', 'user', req.user.id, { Promise });
        })
        .then(() => {
            // Instruct the PAP to construct a new policy file for this group
            pol_admin.newGroupPolicy(newgroupid, req.body.name);
        })
        .then(() => res.json({status: 'success', group: newgroupid}))
        .catch(err => {
            res.status(500);
            res.json({status: 'error', error: err});
        });
    
});

// Get a list of all groups given a userid that the user is part of DUPLICATE of route in /users/groups GET
router.get('/groups', authentication.requireAuthenticated, (req, res) => {
    db.all("SELECT * FROM Groups WHERE id IN (SELECT groupid FROM GroupSubscription WHERE userid=?)", req.user.id, { Promise })
        .then(rows => {
            res.json({status:'success', groups: rows});
        })
        .catch(err => res.json({status:'error', error:err}));
});

// Get all the devices that are part of this group
router.get('/groups/:groupID/devices', authentication.authUserInGroup, (req, res) => {
    db.all("SELECT * FROM Device WHERE id IN (SELECT deviceid FROM GroupSubscription WHERE groupid=?)", req.params.groupID, { Promise })
        .then(rows => {
            res.json({status:'success', devices: rows});
        })
        .catch(err => res.json({status:'error', error:err}));
});

// Add a device to this group
// This also gives them the custom attribute ${groupid}_Member so the access control system can identify that they are part of the group
router.post('/groups/:groupID/devices', authentication.authUserInGroup, (req, res) => {
    // must verify device exists, and the user is the devices owner, and the user has permission to add devices to this group
    db.get("SELECT * FROM Device WHERE id=?", req.body.deviceID, { Promise })
    .then(row => {
        if (row == undefined) {
            return Promise.reject("Invalid device ID supplied");
        } else {
            if (row.ownerid != req.user.id) {
                return Promise.reject("You are not authenticated as the owner of that device");
            }
        }
    })
    .then(() => addDeviceToGroup(req.body.deviceID, req.params.groupID))
    .then(cb => res.json({status:'success'}))
    .catch(err => res.json({status:'error', error:err}));
});

// Remove a device from this group
// Admins can remove any device from their own group
router.delete("/groups/:groupID/devices/:deviceID", authentication.authUserIsGroupAdmin, (req, res) => {
    db.run("DELETE FROM GroupSubscriptions WHERE groupid=? AND deviceid=?", req.group.id, req.params.deviceID, { Promise })
    .then(cb => res.json({status: 'success'}))
    .catch(err => res.json({status:'error', error: err}))
});

// Add a user to this group
// This also gives them the custom attribute ${groupid}_Member so the access control system can identify that they are part of the group
router.post('/groups/:groupID/users', authentication.authUserIsGroupAdmin, (req, res) => {
    addUserToGroup(req.body.userID, req.params.groupID)
    .then(cb => res.json({status:'success'}))
    .catch(err => res.json({status:'error', error:err}));
});

// Create a request for a user to join this group by their username
router.post("/groups/:groupID/users/invite", authentication.authUserInGroup, (req, res) => {
    let user = req.user;
    let targetUser;
    let group = req.group;
    // Verify the target user name supplied is valid
    db.get("SELECT * FROM User WHERE name=?", req.body.username, { Promise })
    .then(row => {
        if (row != undefined) {
            targetUser = row;
        } else {
            return Promise.reject("Target user not found");
        }
    })
    // Create the request
    .then(() => db.run("INSERT INTO GroupRequest(fromuser, fromusername, touser, groupid, groupname, purpose) VALUES (?,?,?,?,?,'usergroupinvite')", user.id, user.name, targetUser.id, group.id, group.name, { Promise }))
    .then(cb => res.json({status:"success"}))
    .catch(err => res.json({status:"error", error:err}))
});

// Get all the users in this group
router.get('/groups/:groupID/users', authentication.authUserInGroup, (req, res) => {
    db.all("SELECT * FROM User WHERE id IN (SELECT userid FROM GroupSubscription WHERE groupid=?)", req.params.groupID, { Promise })
        .then(rows => res.json({status:'success', users: rows}))
        .catch(err => res.json({status:'error', error:err}));
});

// Remove a user from this group
// Admins can remove any user (other than themself) from their own group
router.delete("/groups/:groupID/users/:userID", authentication.authUserIsGroupAdmin, (req, res) => {
    if (req.group.admin == req.params.userID) {
        // Do not allow deletion of the admin
        res.status(403);
        res.json({status:'error', error: "Cannot delete the admin from group"});
        return;
    }

    db.run("DELETE FROM GroupSubscription WHERE groupid=? AND userid=?", req.group.id, req.params.userID, { Promise })
        .then(cb => res.json({status:'success'}))
        .catch(err=> res.json({status:'error', error: err}));
});

// Create a new custom attribute in this group (must supply a name for the attribute, and datatype)
// datatype can be any of ['string', 'integer', 'boolean']
// Only group admin can do these things
router.post('/groups/:groupID/attributes', authentication.authUserIsGroupAdmin, (req, res) => {
    const datatype = req.body.datatype;
    const prettyname = req.body.name;
    const attr_name = `${req.params.groupID}_${prettyname}`;

    // verify datatype supplied is a valid option
    if(!(['string', 'integer', 'boolean'].includes(datatype))) res.json({status:'error', error:'invalid datatype'});

    Promise.resolve(db.run("INSERT INTO AttributeDef(name, prettyname, datatype, groupid) VALUES (?,?,?,?)", attr_name, prettyname, datatype, req.params.groupID, { Promise }))
        .then(function(cb) {
            res.json({status:'success', attribute: cb.lastID});
        })
        .catch(err => res.json({status:'error', error: err}));
});

// Get all the custom attributes that are defined for this group
// Anyone in the group has access to see these
router.get('/groups/:groupID/attributes', authentication.authUserInGroup, (req, res) => {
    db.all("SELECT * FROM AttributeDef WHERE groupid=?", req.params.groupID, { Promise })
        .then(rows => res.json({status:'success', attributes: rows}))
        .catch(err => res.json({status:'error', error: err}));
});

// Give a user a custom attribute from this group, and a value for it - Must be admin of group to do this
// TODO this should check if the user already has the attribute in question, in which case update it rather than create new entry
router.post('/groups/:groupID/users/:userID/attributes', authentication.authUserIsGroupAdmin, (req, res) => {
    const value = String(req.body.value);
    db.run("INSERT OR REPLACE INTO AttributeValue(attrid, value, appliesto, userid) VALUES (?,?,'user',?)", req.body.attrID, value, req.params.userID, { Promise })
        .then(cb => res.json({status:'success'}))
        .catch(err => res.json({status:'error', error:err}));
});

// Get all the custom attributes a user has relevant to this group
router.get('/groups/:groupID/users/:userID/attributes', authentication.authUserInGroup, (req, res) => {
    db.all(`
        SELECT ADef.id, ADef.name, ADef.prettyname, ADef.datatype, AVal.value
        FROM AttributeValue AS AVal
        JOIN AttributeDef AS ADef ON AVal.attrid = ADef.id
        WHERE AVal.userid = ? AND ADef.groupid = ?
    `, req.params.userID, req.params.groupID, { Promise })
        .then(rows => res.json({status:'success', attributes: rows}))
        .catch(err => res.json({status:'error', error: err}));
});

// Give a device a custom attribute from this group, and a value for it
router.post('/groups/:groupID/devices/:deviceID/attributes', authentication.authUserIsGroupAdmin, (req, res) => {
    const value = String(req.body.value);
    db.run("INSERT OR REPLACE INTO AttributeValue(attrid, value, appliesto, deviceid) VALUES (?,?,'device',?)", req.body.attrID, value, req.params.deviceID, { Promise })
        .then(cb => res.json({status:'success'}))
        .catch(err => res.json({status:'error', error:err}));
});

// Get all the attributes this device has relevant to this group
router.get('/groups/:groupID/devices/:deviceID/attributes', authentication.authUserInGroup, (req, res) => {
    db.all(`
        SELECT ADef.id, ADef.name, ADef.prettyname, ADef.datatype, AVal.value
        FROM AttributeValue AS AVal
        JOIN AttributeDef AS ADef ON AVal.attrid = ADef.id
        WHERE AVal.deviceid = ? AND ADef.groupid = ?
    `, req.params.deviceID, req.params.groupID, { Promise })
        .then(rows => res.json({status:'success', attributes: rows}))
        .catch(err => res.json({status:'error', error: err}));
});

// Create a new request for a user to join a group (Requesting user provides the name of the group and request is sent to admin)
router.post('/groups/users/requests', authentication.requireAuthenticated, (req, res) => {
    let user = req.user;
    let targetGroup;
    // First check target group exists
    db.get("SELECT * FROM Groups WHERE name=?", req.body.groupname, { Promise })
    .then(row => {
        if (row != undefined) {
            targetGroup = row;
        } else {
            return Promise.reject("Target group not found");
        }
    })
    // Then create request, going to the groups admin
    .then(() => db.run("INSERT INTO GroupRequest(fromuser, fromusername, touser, groupid, groupname, purpose) VALUES (?,?,?,?,?,'usergrouprequest')", user.id, user.name, targetGroup.admin, targetGroup.id, targetGroup.name, { Promise }))
    .then(cb => res.json({status:"success"}))
    .catch(err => res.json({status:'error', error:err}));
});

// Create a request for adding a device to a group, provided the name of the target group, request is sent to admin
router.post('/groups/devices/requests', authentication.requireAuthenticated, (req, res) => {
    let user = req.user;
    let targetGroup;
    let device;
    // First check target group exists
    db.get("SELECT * FROM Groups WHERE name=?", req.body.groupname, { Promise })
    .then(row => {
        if (row != undefined) {
            targetGroup = row;
        } else {
            return Promise.reject("Target group not found");
        }
    })
    // Verify specified device exists
    .then(() => db.get("SELECT * FROM Device WHERE id=?", req.body.deviceID, { Promise }))
    .then(row => {
        if (row == undefined) {
            return Promise.reject("Specified device not found");
        } else {
            device = row;
        }
    })
    // Then create request, going to the groups admin
    .then(() => db.run("INSERT INTO GroupRequest(fromuser, fromusername, touser, groupid, groupname, purpose, deviceid, devicename) VALUES (?,?,?,?,?,'devicegrouprequest',?,?)", user.id, user.name, targetGroup.admin, targetGroup.id, targetGroup.name, device.id, device.name, { Promise }))
    .then(cb => res.json({status:"success"}))
    .catch(err => res.json({status:'error', error:err}));
});


// Get a users requests (must authenticate themselves)
router.get('/users/requests', authentication.requireAuthenticated, (req, res) => {
    db.all("SELECT * FROM GroupRequest WHERE touser=?", req.user.id, { Promise })
    .then(rows => res.json({status:'success', requests: rows}))
    .catch(err => res.json({status:'error', error:err}));
});

// Respond to a request
router.post('/requests/:requestID', authentication.requireAuthenticated, (req, res) => {
    let request;
    let decision = req.body.decision; // Must be either accept or decline
    if (!(['accept', 'decline']).includes(decision)) res.json({status:'error', error:'Invalid decision, must be accept or decline.'});

    db.get("SELECT * FROM GroupRequest WHERE id=?", req.params.requestID, { Promise })
    .then(row => {
        if (row != undefined) {
            request = row;
            if (request.touser != req.user.id) {
                return Promise.reject("You are unauthorized to act on this request as it was not sent to you");
            }
        } else {
            return Promise.reject("Invalid request ID");
        }
    })
    .then(() => db.run("DELETE FROM GroupRequest WHERE id=?", request.id, { Promise }))
    .then(cb => {
        if (decision == 'decline') {
            return Promise.reject("Successfully declined request"); // This is a bit of a cheat to skip execution of rest of promise
        }
    })
    .then(() => {
        switch(request.purpose) {
            case 'usergroupinvite': // Someone who is inside a group has requested an outsider to join it
                return addUserToGroup(request.touser, request.groupid);
            case 'usergrouprequest': // Someone who is outside of a group has requested an insider to let them join (the admin)
                return addUserToGroup(request.fromuser, request.groupid);
            case 'devicegrouprequest': // Someone who is outside of a group has requested an insider (the admin) let their device join
                return addDeviceToGroup(request.deviceid, request.groupid);
            default:
                return Promise.reject("Internal error: Unknown request purpose");
        }
    })
    .then(cb => res.json({status:'success'}))
    .catch(err => {
        if (err == "Successfully declined request") {
            res.json({status:'success', message: err});
        } else {
            res.json({status:'error', error:err});
        }
    })
});

function addUserToGroup(userid, groupid) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO GroupSubscription(groupid, userid) VALUES (?,?)", groupid, userid, { Promise })
        .then(() => {return db.get("SELECT id FROM AttributeDef WHERE name=?", `${groupid}_Member`, { Promise })})
        .then(row => {
            return db.run("INSERT INTO AttributeValue(attrid, value, appliesto, userid) VALUES (?,?,?,?)", row.id, 'true', 'user', userid, { Promise });
        })
        .then(cb => resolve("success"));
    });
}

function addDeviceToGroup(deviceid, groupid) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO GroupSubscription(groupid, deviceid) VALUES (?,?)", groupid, deviceid, { Promise })
        .then(cb => db.get("SELECT id FROM AttributeDef WHERE name=?", `${groupid}_Member`, { Promise }))
        .then(row => db.run("INSERT INTO AttributeValue(attrid, value, appliesto, deviceid) VALUES (?,?,?,?)", row.id, 'true', 'device', deviceid, { Promise }))
        .then(cb => resolve("success"));
    });
}

module.exports = router;