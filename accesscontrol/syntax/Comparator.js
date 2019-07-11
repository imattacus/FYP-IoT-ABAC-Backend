// const Evaluable = require('./Evaluable');

class Comparator {
    constructor(obj, evaluator) {
        this.evaluator = evaluator;
        if (!('comparator' in obj)) throw new Error("Invalid comparator.");
        this.op = obj.comparator;
        switch (this.op) {
            case 'equalTo':
                if(!('param1' in obj)) throw new Error("Missing param1 in comparator");
                if(!('param2' in obj)) throw new Error("Missing param2 in comparator");
                // this.param1 = new Evaluable(obj.param1);
                // this.param2 = new Evaluable(obj.param2);
                this.param1 = evaluator._DI(obj.param1);
                this.param2 = evaluator._DI(obj.param2);
                break;
            default:
                throw new Error('Invalid comparator operation.');
                break;
        }
    }

    // apply(param, value) {
    //     switch(this.op) {
    //         case "equalTo":
    //             return this.equalTo(param, value);
    //         default:
    //             console.log("No matching comparator found");
    //             return null;
    //     }
    // }

    evaluate(request) {
        switch(this.op) {
            case 'equalTo':
                let v1 = this.param1.evaluate(request);
                let v2 = this.param2.evaluate(request);
                console.log("EQUALTO: " + v1 + ", " + v2);
                return this._equalTo(v1,v2);
            default:
                throw new Error('Cannot evaluate invalid comparator.');
        }
    }

    _equalTo(param, value) {
        return param == value;
    }
}

module.exports = Comparator;