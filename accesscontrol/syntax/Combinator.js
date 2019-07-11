class Combinator {
    constructor(op, evaluableArray) {
        this.op = op;
        this.values = evaluableArray;
    }

    evaluate(request) {
        switch(this.op) {
            case 'anyOf':
                return this._anyOf(request);
            case 'allOf':
                return this._allOf(request);
            default:
                throw new Error('Cannot evaluate invalid combinator.');
        }
    }

    _anyOf(request) {
        let resArray = this.values.map(val => {return val.evaluate(request)});
        console.log("Are any of these true?: " + resArray);
        return resArray.some(v => v == true);
    }

    _allOf(request) {
        let resArray = this.values.map(val => {return val.evaluate(request)});
        return resArray.every(v => v == true);
    }
}

module.exports = Combinator;
