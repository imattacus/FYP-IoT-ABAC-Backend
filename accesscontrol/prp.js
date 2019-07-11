const fs = require('fs');
const PolicySet = require('./syntax/PolicySet');
const path = require('path');

const POL_DIR = path.resolve(__dirname, "./policies/");
const GROUP_DIR = POL_DIR + "/groups";
const DEVICE_DIR = POL_DIR + "/devices";

class PRP {
    constructor() {
        
    }

    getGlobalPolicies() {
        console.log("Getting global policy from PRP");
        return new Promise((resolve, reject) => {
            fs.readFile(POL_DIR + "/global.json", "utf8", (err, data) => {
                if (err) reject(err);
                let obj = JSON.parse(data);
                try {
                    let ps = new PolicySet(obj);
                    resolve(ps);
                } catch(err) {
                    reject(err);
                }
            });
        });
    }

    getGroupPolicy(id) {
        console.log("Getting group policy " + id + " from PRP");
        return new Promise((resolve, reject) => {
            fs.readFile(GROUP_DIR+`/group_${id}.json`, "utf8", (err, data) => {
                if (err) reject(err);
                let obj = JSON.parse(data);
                try {
                    let ps = new PolicySet(obj);
                    resolve(ps);
                } catch(err) {
                    reject(err);
                }
            });
        });
    }

    getDevicePolicy(id) {
        console.log("Getting device policy " + id + " from PRP");
        return new Promise((resolve, reject) => {
            fs.readFile(DEVICE_DIR+`/device_${id}.json`, "utf8", (err, data) => {
                if (err) reject(err);
                let obj = JSON.parse(data);
                try {
                    let ps = new PolicySet(obj);
                    resolve(ps);
                } catch(err) {
                    reject(err);
                }
            });
        });
    }

    getGlobalPoliciesAsync(cb) {
        fs.readFile(path.resolve(__dirname, POL_DIR+"test.json"), 'utf8', (err, data) => {
            if (err) throw err;
            let obj = JSON.parse(data);
            this.global_policies = new PolicySet(obj);
            cb(this.global_policies);
        });
    }
}

module.exports = PRP;