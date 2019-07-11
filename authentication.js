const db = require('sqlite');

function authenticateUser(req, res, next) {
    let userID = req.headers.authorization;
    if (!userID) {
        // No authorization info provided
        req.authenticated = false;
        req.user = null;
        next();
    } else {
        db.get("SELECT * FROM User WHERE id=?", userID, { Promise })
        .then(row => {
            if (row != undefined) {
                req.authenticated = true;
                req.user = row;
                next();
            } else {
                // Invalid user id used to authorize
                res.status(403);
                res.json({status:'error', error:'Authentication credentials invalid'});
            }
        })
        .catch(err => {
            console.error("Error authenticating user " + userID);
            res.status(500);
            res.json({status:'error', error:'Internal server error when authenticating your credentials'});
        });
    }
};

function authOnly(req, res, next) {
    authenticateUser(req, res, () => {
        if (!req.authenticated) {
            res.status(403);
            res.json({status:'error', error:'You must authenticate yourself to access this route'});
        } else {
            next()
        }
    })
}

function userIsInGroup(req, res, next) {
    // Look for groupID in either body or params
    let groupID;
    if ('groupID' in req.params) {
        groupID = req.params.groupID;
    } else if ('groupID' in req.body) {
        groupID = req.body.groupID;
    } else {
        res.status(403);
        res.json({status:'error', error:'Cannot find group ID in request body or params.'})
    }

    authOnly(req, res, () => {
        db.get("SELECT * FROM Groups WHERE id=?", groupID, { Promise })
        .then(row => req.group = row) // Add the group into the request for convenience
        .then(() => db.get("SELECT * FROM GroupSubscription WHERE groupid=? AND userid=?", groupID, req.user.id, { Promise }))
        .then(row=> {
            if (row != undefined) {
                // User is a part of the group, proceed
                next()
            } else {
                res.status(403);
                res.json({status:'error', error:'You are not authorised to access routes for groups you are not part of'});
            }
        })
        .catch(err => {
            res.status(500);
            res.json({status:'error', error: 'Internal server error when authenticating your group membership', details:err});
        })
    })
}

function userIsGroupAdmin(req, res, next) {
    userIsInGroup(req, res, () => {
        if (req.user.id == req.group.admin) {
            // This user is the admin, proceed
            next()
        } else {
            res.status(403);
            res.json({status:'error', error:'Only the group admin is authorised for this route'});
        }
    });
}

module.exports = {
    "authenticate": authenticateUser, 
    "requireAuthenticated": authOnly,
    "authUserInGroup": userIsInGroup, 
    "authUserIsGroupAdmin": userIsGroupAdmin
};