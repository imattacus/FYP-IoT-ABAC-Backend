const express = require('express')
const db = require('sqlite')
const router = express.Router()
const Promise = require('bluebird')
const authentication = require('../authentication')

router.get("/test", authentication.requireAuthenticated, (req, res) => {
    if (req.authenticated) {
        res.send("Thanks for being authenticated " + req.user.name);
    } else {
        res.send("You're not authenticated!");
    }
});

// Register a new household
router.post('/households', (req, res) => {
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

module.exports = router;

