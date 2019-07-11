// const Target = require("./Target");
const Policy = require('./Policy');
const Evaluable = require('./Evaluable');
const CombiningAlgorithm = require('./CombiningAlgorithm');

class PolicySet {
    constructor(rawObj) {
        if(!("id" in rawObj)) throw new Error("id not defined in policyset object.");
        if(!("target" in rawObj)) throw new Error("target not defined in policyset object.");
        if(!("obligations" in rawObj)) throw new Error("obligations not defined in policyset object.");
        if(!("policies" in rawObj)) throw new Error("policies not defined in policyset object.");
        if(!("algorithm" in rawObj)) throw new Error("policy combining algorithm not defined in policyset object.");

        this.id = rawObj.id;
        this.target = new Evaluable(rawObj.target);
        this.obligations = rawObj.obligations;
        this.policies = rawObj.policies.map((policyObj) => {
            if ("rules" in policyObj) {
                return new Policy(policyObj);
            } else if ("policies" in policyObj) {
                return new PolicySet(policyObj);
            } else {
                throw new Error("Policyset " + this.id + " contains invalid child policy");
            }
        });
        this.algorithm = new CombiningAlgorithm(rawObj.algorithm);
    }

    isApplicable(request) {
        // Test if the target is satisfied by the current request to determine if should be further evaluated
        return this.target.evaluate(request);
    }

    evaluate(request) {
        let results = [];
        this.policies.forEach(policy => {
            if (policy.isApplicable(request)) {
                results = results.concat(policy.evaluate(request));
            }
        });
        return this.algorithm.combine(results);
    }
}

module.exports = PolicySet;