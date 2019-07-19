// const Evaluable = require('./Evaluable');

class Comparator {

    constructor(op, param1, param2) {
        this.op = op
        this.param1 = param1
        this.param2 = param2
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
                var v1 = this.param1.evaluate(request);
                var v2 = this.param2.evaluate(request);
                console.log("EQUALTO: " + v1 + ", " + v2);
                return this._equalTo(v1,v2);
            case 'lessThan':
                var v1 = this.param1.evaluate(request);
                var v2 = this.param2.evaluate(request);
                console.log("LESSTHAN: " + v1 + ", " + v2)
                return this._lessThan(v1, v2);
            default:
                throw new Error('Cannot evaluate invalid comparator.');
        }
    }

    _equalTo(param, value) {
        return param == value;
    }

    _lessThan(param, value) {
        return param < value
    }
}

module.exports = Comparator;