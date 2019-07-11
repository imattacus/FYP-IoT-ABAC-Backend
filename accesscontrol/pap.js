const fs = require('fs');
const path = require('path');
const PolicySet = require('./syntax/PolicySet');

const POL_DIR = "./policies/"

// This class is responsible for policy administration - adding/removing/updating policies to the policy store.
class PAP {
    constructor() {
        this.pol_path = path.resolve(__dirname, POL_DIR);
        this.groups_pol_path = path.resolve(__dirname, POL_DIR + "groups");
        this.devices_pol_path = path.resolve(__dirname, POL_DIR + "devices");
    }

    newGroupPolicy(id, name) {
        let group_uid = `group_${id}_${name}`
        let newfilename = `group_${id}.json`;
        let newpolicy = {
            id: group_uid+"_root",
            target: {allOf:[
                {subjectHasAttribute: `${id}_Member`},
                {resourceHasAttribute: `${id}_Member`}
            ]},
            obligations: [],
            algorithm: "firstApplicable",
            policies:[]
        };
        return new Promise((resolve, reject) => {
            fs.writeFile(this.groups_pol_path + '/' + newfilename, JSON.stringify(newpolicy, null, 4), (err) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                console.log("Successfully created new group policy file for group " + id + " : " + name);
                // On success return path to the file
                resolve(this.groups_pol_path + '/' + newfilename);
            })
        })
    }

    newDevicePolicy(id, name) {
        let device_uid = `device_${id}_${name}`;
        let newfilename = `device_${id}.json`;
        let newpolicy = {
            id: device_uid+"_root",
            target: {comparator:'equalTo', param1:{resourceAttribute:'device_id'}, param2:{value:id}},
            obligations: [], 
            algorithm: 'firstApplicable',
            policies: []
        };
        return new Promise((resolve, reject) => {
            fs.writeFile(this.devices_pol_path + '/' + newfilename, JSON.stringify(newpolicy, null, 4), (err) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                console.log("Successfully created new device policy file for device " + id + " : " + name);
                resolve(this.devices_pol_path + '/' + newfilename);
            })
        });
    }
}

module.exports = PAP;