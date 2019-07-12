const express = require('express')
const db = require('sqlite')
const router = express.Router()
const Promise = require('bluebird')
const authentication = require('../authentication')
const SimulationCommunicator = require('../SimulationCommunicator')

const rp = require('request-promise');

const PolicyDecisionPoint = require('../accesscontrol/pdp');
const Request = require("../accesscontrol/syntax/Request");
const PolicyAdminPoint = require('../accesscontrol/pap');

const PDP = new PolicyDecisionPoint();
const PAP = new PolicyAdminPoint();

// Register a new device without an owner, this device is unclaimed and needs to be claimed by a user to make them owner
router.post('/newdevice', (req, res) => {
    const name = req.body.name;
    let deviceid;
    db.run("INSERT INTO Device(name, ownerid) VALUES (?,null)", name, { Promise })
        .then(cb => {
            // Instruct the PAP to create a new policy file for this new device
            deviceid = cb.lastID;
            PAP.newDevicePolicy(deviceid, name);
        })
        .then(() => res.json({deviceID : deviceid}))
        .catch(err => res.json(err));
});

// Get a devices info - must provide a user id and authorization will be checked
router.get('/devices/:deviceID', authentication.requireAuthenticated, (req, res) => {
    // PEP - will parse request, and send an authorization request to the PDP
    // Must fill out request with relevant attributes, of the subject (user), the desired resource (device), and attributes of the action
    const userID = req.user.id;
    const deviceID = req.params.deviceID;

    let authrequest = new Request();
    authrequest.setActionType('status');
    authrequest.populateAttributes(db, userID, deviceID)
        .then(() => PDP.evaluate(authrequest, db))
        .then(response => {
            if (response.Decision != 'Permit') {
                res.status(403);
                return Promise.reject("Sorry not authorized");
            } else {
                // User is authorized to get this device
                return db.get("SELECT * FROM Device WHERE id=?", deviceID, { Promise })
            }
        })
        .then(row => res.json({status:'success', device:row}))
        .catch(err => res.json({status:'error', error: err}));

});

// Set a devices status, verifies if user has permission to do this simply
router.post('/devices/:deviceID', authentication.requireAuthenticated, (req, res) => {
    const userID = req.user.id;
    const deviceID = req.params.deviceID;
    const status = req.body.status;

    // First form an authorization request for this intended device access
    let authrequest = new Request();
    authrequest.populateAttributes(db, userID, deviceID)
        .then(_ => PDP.evaluate(authrequest, db)) // Send the request to the PDP to be evaluated
        .then(result => {
            console.log(result);
            if (result.Decision != 'Permit') {
                // No good response from PDP so not going to allow this
                res.status(403);
                return Promise.reject('User did not have permission to access this device.');
            } else if (SimulationCommunicator.isConnected()){
                // User is allowed 
                console.log("User access is allowed");
                console.log("Sending request to server from user id " + userID + " for device " + deviceID);

                return SimulationCommunicator.sendDeviceStatus(deviceID, status)
            } else {
                Promise.reject("Server has no connection to the simulator!")
            }
        })
        .then(body => {
            if (body == "success") {
                return db.run("UPDATE Device SET status=? WHERE id=?", status, deviceID, { Promise });
            } else {
                res.status(500);
                return Promise.reject("could not set status of device");
            }
        })
        .then(cb => cb.changes > 0 ? res.send('success') : res.send('fail'))
        .catch(err=> {
            console.log("error")
            res.send(err)
        });
});

module.exports = router;