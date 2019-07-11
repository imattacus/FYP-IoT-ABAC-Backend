const PolicySet = require('./syntax/PolicySet');
const PRP = require('./prp');
const Response = require('./syntax/Response');
const CombiningAlgorithm = require('./syntax/CombiningAlgorithm');

class PDP {
    constructor(){
        this.prp = new PRP();
        this.combiner = new CombiningAlgorithm('denyOverrides');
    }

    evaluate(request, db) {
        // Evaluate a request.. A lot will happen here:
        console.log("PDP evaluating request: " + request);

        let userid = request.getSubjectAttribute('user_id').value;
        let deviceid = request.getResourceAttribute('device_id').value;

        return new Promise((resolve, reject) => {
            let global_ps;
            let device_ps;
            let group_pss;
            let responses;
            // First must retrieve global policy for all requests
            this.prp.getGlobalPolicies()
            .then(ps => global_ps = ps)
            // Then get the device policy for this specific device
            .then(() => this.prp.getDevicePolicy(deviceid))
            .then(ps => device_ps = ps)
            .then(() => {
                // Find out all the groups that the user and device are a part of as these policies need to be considered
                return db.all("SELECT groupid FROM GroupSubscription WHERE userid=? OR deviceid=?", userid, deviceid, { Promise });
            })
            // Then get all the policies from PRP for those groups
            .then(rows => {
                let ids = rows.map(row => row.groupid);
                console.log("Got the relevant group IDs as " + ids);
                return Promise.all((Array.from(new Set(ids))).map(id => {return this.prp.getGroupPolicy(id)}));
            })
            .then(pss => group_pss = pss)
            .then(() => {
                // Now we have all of the policies we can evaluate them and combine to come to a final decision
                let policysets = (new Array()).concat(global_ps, device_ps, group_pss);
                return Promise.all(policysets.map(ps => {return ps.evaluate(request)}));
            })
            .then(responses => {
                resolve(this.combiner.combine(responses))
            })
            .catch(err => reject(err));

        });
    }
}

module.exports = PDP;