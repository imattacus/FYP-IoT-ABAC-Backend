const Comparator = require('./Comparator');

class Condition {
    constructor(rawObj) {
        if (Object.keys(rawObj).length == 0) {
            // This is an empty object, therefore condition applies to everything
            this.isEmpty = true;
            return;
        }

        if(!("attribute" in rawObj)) throw new Error("Missing attribute in condition.");
        if(!("comparator" in rawObj)) throw new Error("Missing comparator in condition.");
        if(!("value" in rawObj)) throw new Error("Missing value in condition.");
        this.attribute = rawObj.attribute;
        this.comparator = new Comparator(rawObj.comparator);
        this.value = rawObj.value;
    }

    evaluate(request) {
        // Evaluate a condition in the context of an authorization request
        // Empty conditions should evaluate to true
        if (this.isEmpty) return true;

        let attribute_value = request.getAttribute(this.attribute).value;
        let second_value;
        if (typeof this.value === 'object') {
            if(!("attribute" in this.value)) throw new Error("Missing attribute in condition value.");
            console.log("looking up attribute " + this.value.attribute);
            second_value = request.getAttribute(this.value.attribute).value;
        } else {
            second_value = this.value;
        }
        console.log("attribute_value: " + attribute_value + " second value: " + second_value);
        return this.comparator.apply(attribute_value, second_value);
    }
}

module.exports = Condition;