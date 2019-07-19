const Combinator = require('./Combinator');
const Comparator = require('./Comparator');

class Evaluable {
    constructor(obj) {
        console.log(obj)
        if (Object.keys(obj).length == 0) {
            this.op = 'empty'
            return
        }

        // This is a value literal because it contains the key 'value'
        if ('value' in obj) {
            this.op = 'value';
            this.value = obj.value;
            this.data_type = obj.data_type;
            return;
        }

        // This is a subject attribute lookup because it contains the key 'subjectAttribute'
        if ('subjectAttribute' in obj) {
            this.op = 'subjectAttribute';
            this.attr = obj.subjectAttribute;
            this.default_value = new Evaluable(obj.default_value)
            return;
        }

        // This is a resource attribute lookup because it contains the key 'resourceAttribute'
        if ('resourceAttribute' in obj) {
            this.op = 'resourceAttribute';
            this.attr = obj.resourceAttribute;
            this.default_value = new Evaluable(obj.default_value)
            return;
        }

        if ('environmentAttribute' in obj) {
            this.op = 'environmentAttribute'
            this.attr = obj.environmentAttribute
            this.default_value = new Evaluable(obj.default_value)
            return
        }

        // This is a comparator because it contains the key 'comparator'
        if ('comparator' in obj) {
            this.op = 'comparator';
            let param1 = new Evaluable(obj.param1)
            let param2 = new Evaluable(obj.param2)
            this.comparator = new Comparator(obj.comparator, param1, param2);
            return;
        }

        // This is an allOf combinator because it contains the key 'allOf'
        if ('allOf' in obj) {
            this.op = 'combinator';
            this.combinator = new Combinator('allOf', obj.allOf.map(n => {
                let child = new Evaluable(n)
                return child
            }));
            return;
        }
        if ('anyOf' in obj) {
            this.op = 'combinator';
            this.combinator = new Combinator('anyOf', obj.anyOf.map(n => {
                let child = new Evaluable(n)
                return child
            }));
            return;
        }

        // This is an attribute presence check on the subject because it contains the key 'subjectHasAttribute'
        if ('subjectHasAttribute' in obj) {
            this.op = 'subjectHasAttribute';
            this.attr = obj.subjectHasAttribute;
            return;
        }
        // This is an attribute check on the resource because it contains the key 'resourceHasAttribute'
        if ('resourceHasAttribute' in obj) {
            this.op = 'resourceHasAttribute';
            this.attr = obj.resourceHasAttribute;
            return;
        }

        if ('actionType' in obj) {
            this.op="actionType"
            this.action = obj.actionType
            return;
        }
    }

    evaluate(request) {
        let ret
        switch(this.op) {
            case 'empty':
                ret = true
                break
            case 'value':
                ret = this.value;
                break
            case 'subjectAttribute':
                ret = this._getSubjectAttribute(request);
                break
            case 'resourceAttribute':
                ret = this._getResourceAttribute(request);
                break
            case 'environmentAttribute':
                ret = this._getEnvironmentAttribute(request)
                break
            case 'combinator':
                ret = this.combinator.evaluate(request);
                break
            case 'comparator':
                ret = this.comparator.evaluate(request);
                break
            case 'subjectHasAttribute':
                ret = this._subjectHasAttribute(request);
                break
            case 'resourceHasAttribute':
                ret = this._resourceHasAttribute(request);
                break
            case 'actionType':
                ret = this._actionType(request);
                break
            default:
                throw new Error("Could not evaluate invalid evaluable.");
        }
        this.result = ret
        return this.result
    }

    _getSubjectAttribute(request) {
        try {
            return request.getSubjectAttribute(this.attr).value;
        } catch(err) {
            return this.default_value.evaluate()
        }
    }

    _getResourceAttribute(request) {
        try {
            return request.getResourceAttribute(this.attr).value;
        } catch(err) {
            return this.default_value.evaluate()
        }
    }

    _getEnvironmentAttribute(request) {
        try {
            return request.getResourceAttribute(this.attr.attribute_id).value
        } catch(err) {
            return this.default_value.evaluate()
        }
    }

    _subjectHasAttribute(request) {
        try {
            let attr = request.getSubjectAttribute(this.attr.attribute_id)
            if (attr == undefined) {
                return false
            }
            return true
        } catch (err) {
            return false
        }
    }

    _resourceHasAttribute(request) {
        try {
            let attr = request.getResourceAttribute(this.attr.attribute_id)
            if (attr == undefined) {
                return false
            }
            return true
        } catch(err) {
            return false
        }
    }

    _actionType(request) {
        return this.action == request.getActionType()
    }

}

module.exports = Evaluable;

