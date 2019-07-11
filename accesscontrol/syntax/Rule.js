// const Target = require('./Target');
// const Condition = require('./Condition');
const Response = require('./Response');
const Evaluable = require('./Evaluable');

class Rule {
    constructor(rawObj) {
        if(!("id" in rawObj)) throw new Error("id not defined in rule object.");
        if(!("target" in rawObj)) throw new Error("target not defined in rule object.");
        if(!("obligations" in rawObj)) throw new Error("obligations not defined in rule object.");
        if(!("condition" in rawObj)) throw new Error("condition not defined in rule object.");
        if(!("effect" in rawObj)) throw new Error("effect not defined in rule object.");

        this.id = rawObj.id;
        this.target = new Evaluable(rawObj.target);
        this.condition = new Evaluable(rawObj.condition);
        this.effect = rawObj.effect;
        this.obligations = rawObj.obligations;
    }

    isApplicable(request) {
        // Evaluate the target of this rule to decide if it is applicable to this request
        return this.target.evaluate(request);  
    }

    evaluate(request) {
        // Evaluate the condition of this rule to determine what decision should be made (CAUTION does not test target, just condition)
        let response = new Response();
        if (this.condition.evaluate(request)) {
            response.setDecision(this.effect);
            response.setObligations(this.obligations);
        }
        return response;
    }
}

module.exports = Rule;