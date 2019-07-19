const express = require('express')
const db = require('sqlite')
const router = express.Router()
const Promise = require('bluebird')
const authentication = require('../authentication')
const PRP = require('../accesscontrol/prp')
const PAP = require('../accesscontrol/pap')
const Request = require('../accesscontrol/syntax/Request')
const simulationCommunicator = require('../SimulationCommunicator')

const defaultAttributes = require('../accesscontrol/defaultAttributes')

router.get("/test", authentication.requireAuthenticated, (req, res) => {
    if (req.authenticated) {
        res.send("Thanks for being authenticated " + req.user.name);
    } else {
        res.send("You're not authenticated!");
    }
});

// Register a new household
router.post('/households', (req, res) => {
    console.log("Adding household to db");
    const housename = req.body.name;
    db.run("INSERT INTO Household(name) VALUES (?)", housename, { Promise })
        .then(cb => { // Using the callback values of the INSERT function to send back new house ID
            res.json({houseid : cb.lastID});
        })
        .catch(err => res.json(err));
});

// Register a new user account
router.post('/', (req, res) => {
    const name = req.body.name;
    if (!name) {
        res.status(400).json({status:'error', error:'Must provide name to login as'});
        return
    }
    db.run("INSERT INTO User(name) VALUES (?)", name, { Promise })
        .then(cb => db.get("SELECT * FROM User WHERE id=?", cb.lastID, { Promise }))
        .then(row => {
            res.json({status:'success', user:row});
        })
        .catch(err => res.json({status:'error', error:err}));
});

// Login stub - just sends back user id
router.post('/login', (req, res) => {
    const username = req.body.username;
    console.log(username + " is trying to log in!")
    db.get("SELECT * FROM User WHERE name=?", username, { Promise })
        .then(row => {
            if (row != undefined) {
                res.json({status:'success', user: row});
            } else {
                res.json({status:'fail'});
            }
        })
        .catch(err => res.status(500).json({status: 'error', error: err}));
});

// Make user owner of device (used for claiming new devices)
router.post('/access', authentication.requireAuthenticated, (req, res) => {
    const userID = req.user.id;
    const deviceID = req.body.deviceID;
    console.log("making user " + userID + " owner of device " + deviceID);
    db.run("UPDATE Device SET ownerid=? WHERE id=?", userID, deviceID, { Promise })
        .then(() => res.send("done"))
        .catch(err => res.send(err));
});

// Get all the devices that a user is the owner of 
router.get('/devices', authentication.requireAuthenticated, (req, res) => {
    db.all("SELECT * FROM Device WHERE ownerid=?", req.user.id)
        .then(rows => res.json(rows))
        .catch(err => res.json(err));
});

// Get all groups a user is part of
router.get('/groups', authentication.requireAuthenticated, (req, res) => {
    db.all("SELECT * FROM Groups WHERE id IN (SELECT groupid FROM GroupSubscription WHERE userid=?)", req.user.id, { Promise })
        .then(rows => {
            res.json({status:'success', groups: rows});
        })
        .catch(err => res.json({status:'error', error:err}));
});

// Get all the policies a user can access (is admin of group, or is owner of device)
router.get('/policies', authentication.requireAuthenticated, (req, res) => {
    let userid = req.user.id
    let groups
    let devices
    db.all("SELECT id, name FROM Groups WHERE admin=?", userid, {Promise})
    .then(rows => groups = rows)
    .then(() => db.all("SELECT id, name FROM Device WHERE ownerid=?", userid, { Promise }))
    .then(rows => devices = rows)
    .then(() => res.json({status:'success', groups: groups, devices: devices}))
    .catch(err => res.json({status:'error', error: err}))
});

// Get a group policy - sends the json
router.get('/policies/group/:groupID', authentication.authUserIsGroupAdmin, (req, res) => {
    let prp = new PRP()
    prp.getGroupPolicyJSON(req.params.groupID)
    .then(json => res.json({status:'success', data: json}))
    .catch(err => res.json({status:'error', error:err}))
});

router.post('/policies/group/:groupID', authentication.authUserIsGroupAdmin, (req, res) => {
    let pap = new PAP()
    pap.setGroupPolicy(req.params.groupID, req.body.data)
    .then(() => res.json({status:'success'}))
    .catch(err => res.json({status: 'error', error: err}))
})

router.get('/editor/groupdetails/:groupID', authentication.authUserIsGroupAdmin, (req, res) => {
    let userDefaultAttributes = defaultAttributes.userDefaultAttributes
    let deviceDefaultAttributes = defaultAttributes.deviceDefaultAttributes
    let envDefaultAttributes = defaultAttributes.environmentDefaultAttributes
    let envAttributesAndValues = [
        {
            attribute_id: 'env_time',
            data_type: 'integer',
            value: simulationCommunicator.time
        },
        {
            attribute_id: 'env_date',
            data_type: 'integer',
            value: simulationCommunicator.date
        }
    ]
    let groupCustomAttributes
    let usersAndAttributes
    let devicesAndAttributes

    db.all("SELECT name AS attribute_id, prettyname, datatype AS data_type FROM AttributeDef WHERE groupid=?", req.params.groupID, { Promise })
    .then(rows => groupCustomAttributes = rows)
    .then(() => db.all("SELECT * FROM User WHERE id IN (SELECT userid FROM GroupSubscription WHERE groupid=?)", req.params.groupID, { Promise }))
    .then(rows => Promise.all(rows.map(row => {
        return new Promise((resolve, reject) => {
            let user = row
            let attributes = new Request()
            Promise.all([attributes.populateUserDefaultAttributes(db, user.id), attributes.populateUserCustomAttributes(db, user.id)])
            .then(() => {
                resolve({user: user, attributes: attributes.Subject})
            })
            .catch(err => reject({error:"error getting attributes for user " + user.id, err: err}))
        })
    })))
    .then(results => usersAndAttributes = results)
    .then(() => db.all("SELECT * FROM Device WHERE id IN (SELECT deviceid FROM GroupSubscription WHERE groupid=?)", req.params.groupID, { Promise }))
    .then(rows => Promise.all(rows.map(row => {
        return new Promise((resolve, reject) => {
            let device = row
            let attributes = new Request()
            Promise.all([attributes.populateDeviceDefaultAttributes(db, device.id), attributes.populateDeviceCustomAttributes(db, device.id)])
            .then(() => {
                resolve({device: device, attributes: attributes.Resource})
            })
            .catch(err => reject({error:"error getting attributes for device " + device.id, err: err}))
        })
    })))
    .then(results => devicesAndAttributes = results)
    .then(() => {
        res.json({status:"success", data: {
            userDefaultAttributes: userDefaultAttributes,
            deviceDefaultAttributes: deviceDefaultAttributes,
            environmentDefaultAttributes: envAttributesAndValues,
            groupCustomAttributes: groupCustomAttributes,
            users: usersAndAttributes,
            devices: devicesAndAttributes
        }})
    })
    .catch(err => res.json({status: 'error', error: err}))

})

module.exports = router;

