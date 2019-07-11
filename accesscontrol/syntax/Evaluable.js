const Combinator = require('./Combinator');
const Comparator = require('./Comparator');

class Evaluable {
    constructor(obj) {
        if (Object.keys(obj).length == 0) {
            this.isEmpty = true;
        }

        // This is a value literal because it contains the key 'value'
        if ('value' in obj) {
            this.op = 'value';
            this.value = obj.value;
            return;
        }

        // This is a subject attribute lookup because it contains the key 'subjectAttribute'
        if ('subjectAttribute' in obj) {
            this.op = 'subjectAttribute';
            this.attr = obj.subjectAttribute;
            return;
        }

        // This is a resource attribute lookup because it contains the key 'resourceAttribute'
        if ('resourceAttribute' in obj) {
            this.op = 'resourceAttribute';
            this.attr = obj.resourceAttribute;
            return;
        }

        // This is a comparator because it contains the key 'comparator'
        if ('comparator' in obj) {
            this.op = 'comparator';
            this.comparator = new Comparator(obj, this);
            return;
        }

        // This is an allOf combinator because it contains the key 'allOf'
        if ('allOf' in obj) {
            this.op = 'combinator';
            this.combinator = new Combinator('allOf', obj.allOf.map(n => {return new Evaluable(n)}));
            return;
        }
        if ('anyOf' in obj) {
            this.op = 'combinator';
            this.combinator = new Combinator('anyOf', obj.anyOf.map(n => {return new Evaluable(n)}));
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
    }

    evaluate(request) {
        if (this.isEmpty) return true;
        switch(this.op) {
            case 'value':
                return this.value;
            case 'subjectAttribute':
                return this._getSubjectAttribute(request);
            case 'resourceAttribute':
                return this._getResourceAttribute(request);
            case 'combinator':
                return this.combinator.evaluate(request);
            case 'comparator':
                return this.comparator.evaluate(request);
            case 'subjectHasAttribute':
                return this._subjectHasAttribute(request);
            case 'resourceHasAttribute':
                return this._resourceHasAttribute(request);
            default:
                throw new Error("Could not evaluate invalid evaluable.");
        }
    }

    _getSubjectAttribute(request) {
        try {
            return request.getSubjectAttribute(this.attr).value;
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    _getResourceAttribute(request) {
        try {
            return request.getResourceAttribute(this.attr).value;
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    _subjectHasAttribute(request) {
        console.log("Subject has attribute " + this.attr + " = " + !(request.getSubjectAttribute(this.attr) == undefined));
        return !(request.getSubjectAttribute(this.attr) == undefined);
    }

    _resourceHasAttribute(request) {
        console.log("Resource has attribute " + this.attr + " = " + !(request.getResourceAttribute(this.attr) == undefined));
        return !(request.getResourceAttribute(this.attr) == undefined);
    }

    _DI(obj) {
        return new Evaluable(obj);
    }
}

module.exports = Evaluable;

