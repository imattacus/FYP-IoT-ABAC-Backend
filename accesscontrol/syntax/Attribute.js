class Attribute {
    _obj_constructor(rawObj) {
        if(!("attribute_id" in rawObj)) throw new Error("No attribute_id in attribute.");
        if(!("data_type" in rawObj)) throw new Error("No data_type in attribute.");
        if(!("value" in rawObj)) throw new Error("No value in attribute.");
        this.attribute_id = rawObj.attribute_id;
        this.data_type = rawObj.data_type;
        this.value = rawObj.value;
    }
    
    constructor(id, data_type, value) {
        this.attribute_id = id;
        this.data_type = data_type;
        this.value = value;
    }
}

module.exports = Attribute;