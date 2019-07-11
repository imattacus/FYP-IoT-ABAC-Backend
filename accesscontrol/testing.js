// const express = require('express');
// const db = require('sqlite');
// const Promise = require('bluebird');

// function accesscontrol(req, res, next) {
//     console.log("Access control middleware hit!");
//     next();
// }

// module.exports = {accesscontrol};

// Can use this file to test how everything works without starting the server I hope.
const fs = require('fs');
// const Request = require("./syntax/Request");
// const Target = require('./syntax/Target');
// const PDP = require("./pdp");
// const PolicySet = require("./syntax/PolicySet");



//console.log(ex_request);
// console.log(ex_request.getAttribute("user_id"));
// console.log(ex_request.getAttribute("device_owner_id"));

// Test if the Target works to compare attribute with value
// const ex_target = new Target({attribute:"user_id", comparator: "equalTo", value: 1});
// console.log(ex_target.evaluate(ex_request));

// let pdp = new PDP();
// pdp.evaluate(ex_request, (res => {
//     console.log(res);
// }));

// const policyObj = JSON.parse(fs.readFileSync('./policies/global.json', 'utf8'));
// let global_policies = policyObj.map((ps)=>{return new PolicySet(ps)});
// console.log(global_policies);


const sqlite = require('sqlite');
const Request = require('./syntax/Request');
const PDP = require('./pdp');
const PAP = require('./pap');
const PolicySet = require('./syntax/PolicySet');

let obj = JSON.parse(fs.readFileSync('./examples/fileowner_example_request.json', 'utf8'));
let authreq = new Request();
authreq._obj_constructor(obj);

let psobj = JSON.parse(fs.readFileSync('./policies/global.json', "utf8"));
let ps = new PolicySet(psobj);

console.log(ps.evaluate(authreq));

// let pdp = new PDP();
// sqlite.open('../database.db', { Promise })
//     // .then(db => authreq.populateAttributes(db, 1, 1))
//     .then(() => pdp.evaluate(authreq))
//     .then(response => console.log(response));

// let pap = new PAP();
// pap.newGroupPolicy(1, 'test')
//     .then(ret => console.log(ret));

// pap.newGroupPolicy(2, 'test')
//     .then(ret => console.log(ret));

// pap.newGroupPolicy(3, 'test')
//     .then(ret => console.log(ret));

// pap.newDevicePolicy(1, "test")
//     .then(ret => console.log(ret));