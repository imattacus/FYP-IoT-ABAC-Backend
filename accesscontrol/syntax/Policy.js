// const Target = require("./Target");
const Rule = require("./Rule");
const Evaluable = require("./Evaluable");
const CombiningAlgorithm = require('./CombiningAlgorithm');

class Policy {
    constructor(rawObj) {
        if(!("id" in rawObj)) throw new Error("id not defined in policy object.");
        if(!("target" in rawObj)) throw new Error("target not defined in policy object.");
        if(!("obligations" in rawObj)) throw new Error("obligations not defined in policy object.");
        if(!("rules" in rawObj)) throw new Error("rules not defined in policy object.");
        if(!("algorithm" in rawObj)) throw new Error("policy combining algorithm not defined in policy object.");

        this.id = rawObj.id;
        this.target = new Evaluable(rawObj.target);
        this.obligations = rawObj.obligations;
        this.rules = rawObj.rules.map((ruleObj)=>{return new Rule(ruleObj)});
        this.algorithm = new CombiningAlgorithm(rawObj.algorithm);
    }

    isApplicable(request) {
        // Test if the target is satisfied by the current request to determine if should be further evaluated
        return this.target.evaluate(request);
    }

    evaluate(request) {
        let results = [];
        this.rules.forEach(rule => {
            if (rule.isApplicable(request)) {
                results.push(rule.evaluate(request));
            }
        });
        return this.algorithm.combine(results);
    }
}

module.exports = Policy;