// Example of a target:
// target: {"attribute" :'user_id', "comparator": 'equalTo', "value": 1}
// targets, unlike conditions can only be simple boolean statements, so comparing an attribute to a given value (not to another attr)
const Comparator = require('./Comparator');

class Target {
    constructor(rawObj) {
        if (Object.keys(rawObj).length == 0) {
            // This is an empty object, therefore target applies to everything
            this.isEmpty = true;
            return;
        }

        if(!("attribute" in rawObj)) throw new Error("Missing attribute in target.");
        if(!("comparator" in rawObj)) throw new Error("Missing comparator in target.");
        if(!("value" in rawObj)) throw new Error("Missing value in target.");
        this.attribute = rawObj.attribute;
        this.comparator = new Comparator(rawObj.comparator);
        this.value = rawObj.value;
    }

    evaluate(request) {
        // Evaluate a target in the context of an authorization request to see if the policy should apply
        // Empty targets apply to everything
        if (this.isEmpty) return true;

        let attribute_value = request.getAttribute(this.attribute).value;
        return this.comparator.apply(attribute_value, this.value);
    }
}

module.exports = Target;