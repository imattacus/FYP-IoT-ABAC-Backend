// const Target = require("./Target");
const Rule = require("./Rule");
const Evaluable = require("./Evaluable");
const CombiningAlgorithm = require('./CombiningAlgorithm');

class Policy {
    constructor(rawObj) {
        console.log("Constructing new AC Policy object")
        if(!("id" in rawObj)) throw new Error("id not defined in policy object.");
        if(!("target" in rawObj)) throw new Error("target not defined in policy object.");
        if(!("obligations" in rawObj)) throw new Error("obligations not defined in policy object.");
        if(!("children" in rawObj)) throw new Error("children not defined in policy object.");
        if(!("algorithm" in rawObj)) throw new Error("policy combining algorithm not defined in policy object.");
        if("name" in rawObj) {
            this.name = rawObj.name
        } else {
            this.name = "No Name"
        }
        if("description" in rawObj) {
            this.description = rawObj.description
        } else {
            this.description = "No Description"
        }

        this.id = rawObj.id;
        this.target = new Evaluable(rawObj.target);
        this.obligations = rawObj.obligations;
        this.children = rawObj.children.map((child)=>{
            if ("condition" in child) {
                // Child is a rule
                let newRule = new Rule(child) 
                return newRule
            } else {
                // Child is another policy
                let newPolicy = new Policy(this)
                newPolicy._obj_constructor(child)
                return newPolicy
            }
        });
        this.algorithm = new CombiningAlgorithm(this.id, this.description, rawObj.algorithm);
    }

    isApplicable(request) {
        // Test if the target is satisfied by the current request to determine if should be further evaluated
        return this.target.evaluate(request);
    }

    evaluate(request) {
        let results = [];
        this.children.forEach(child => {
            if (child.isApplicable(request)) {
                results.push(child.evaluate(request));
            }
        });
        return this.algorithm.combine(results);
    }
}

module.exports = Policy;