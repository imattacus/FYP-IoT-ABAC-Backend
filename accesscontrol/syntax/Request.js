// An example request can be seen in the examples directory, made up of info about Subject, Resource, Action and Environment
const Attribute = require('./Attribute');

class Request {

    constructor() {
        // Create an empty request
        this.Subject = {Attributes:[]};
        this.Resource = {Attributes:[]};
        this.Action = {Type: "unknown", Attributes:[]};
        this.Environment = {Attributes:[]};
    }

    _obj_constructor(obj) {
        if(!("Subject" in obj)) throw new Error("No Subject in request.");
        if(!("Resource" in obj)) throw new Error("No Resource in request.");
        if(!("Environment" in obj)) throw new Error("No Environment in request.");
        if(!("Action" in obj)) throw new Error("No Action in request.");
        if(!("Attributes" in obj.Subject)) throw new Error("No Attributes in request Subject.");
        if(!("Attributes" in obj.Resource)) throw new Error("No Attributes in request Resource.");
        if(!("Attributes" in obj.Environment)) throw new Error("No Attributes in request Environment.");
        if(!("Attributes" in obj.Action)) throw new Error("No Attributes in request Action.");
        if(!("Type" in obj.Action)) throw new Error("No Type in request Action.");
        this.Subject.Attributes = obj.Subject.Attributes.map((attr)=>{return Object.assign(new Attribute, attr)});
        this.Resource.Attributes = obj.Resource.Attributes.map((attr)=>{return Object.assign(new Attribute, attr)});
        this.Action.Type = obj.Action.Type;
        this.Action.Attributes = obj.Action.Attributes.map((attr)=>{return Object.assign(new Attribute, attr)});
        this.Environment.Attributes = obj.Environment.Attributes.map((attr)=>{return Object.assign(new Attribute, attr)});
    }

    getSubjectAttribute(name) {
        // Get an attribute from this request by its ID (which is a unique descriptive string), if not found return undefined
        let res = this.Subject.Attributes.find(attr => attr.attribute_id == name);
        if (res != undefined) return res;
        throw new Error("Could not get attribute " + name + " from the subject in this request");
    }

    getResourceAttribute(name) {
        let res = this.Resource.Attributes.find(attr => attr.attribute_id == name);
        if (res != undefined) return res;
        throw new Error("Could not get attribute " + name + " from the resource in this request");
    }

    getEnvironmentAttribute(name) {
        return this.Environment.Attributes.find(attr=> attr.attribute_id == name);
    }

    getActionAttribute(name) {
        return this.Action.Attributes.find(attr=> attr.attribute_id == name);
    }

    _addSubjectAttribute(attr) {
        this.Subject.Attributes.push(attr);
    }

    _addResourceAttribute(attr) {
        this.Resource.Attributes.push(attr);
    }

    _addActionAttribute(attr) {
        this.Action.Attributes.push(attr);
    }

    _addEnvironmentAttribute(attr) {
        this.Environment.Attributes.push(attr);
    }

    setActionType(type) {
        this.Action.Type = type;
    }

    populateUserDefaultAttributes(db, userid) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM User WHERE id=?", userid, { Promise })
                .then(row => {
                    this._addSubjectAttribute(new Attribute("user_id", "integer", row.id));
                    this._addSubjectAttribute(new Attribute("user_name", "string", row.name));
                    resolve();
                })
                .catch(err => reject("Could not get default user attributes from database."));
        });
    }

    populateUserCustomAttributes(db, userid) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT ADef.name, ADef.datatype, AVal.value
                FROM AttributeValue AS AVal
                JOIN AttributeDef AS ADef
                ON AVal.attrid = ADef.id
                WHERE AVal.userid = ?
            `, userid, { Promise })
            .then(rows => {
                rows.map(attr => this._addSubjectAttribute(new Attribute(attr.name, attr.datatype, attr.value)));
                resolve();
            })
            .catch(err => {reject("Could not get user custom attributes from database!")})
        });
    }

    populateDeviceDefaultAttributes(db, deviceid) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM Device WHERE id=?", deviceid, { Promise })
                .then(row => {
                    if (row == undefined) reject("No such device to get attributes for!");
                    this._addResourceAttribute(new Attribute("device_id", "integer", row.id));
                    this._addResourceAttribute(new Attribute("device_owner_id", "integer", row.ownerid));
                    resolve();
                })
                .catch(err => {
                    reject("Could not get default device attributes from database.")
                });
        });
    }

    populateDeviceCustomAttributes(db, deviceid) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT ADef.name, ADef.datatype, AVal.value
                FROM AttributeValue AS AVal
                JOIN AttributeDef AS ADef
                ON AVal.attrid = ADef.id
                WHERE AVal.deviceid = ?
            `, deviceid, { Promise })
            .then(rows=> {
                rows.map(attr=> this._addResourceAttribute(new Attribute(attr.name, attr.datatype, attr.value)));
                resolve();
            })
            .catch(err => reject("Could not get device custom attributes from database!"))
        });
    }

    populateAttributes(db, userid, deviceid) {
        return Promise.all([
            this.populateUserDefaultAttributes(db, userid),
            this.populateUserCustomAttributes(db, userid),
            this.populateDeviceDefaultAttributes(db, deviceid),
            this.populateDeviceCustomAttributes(db, deviceid)
        ]);
    }

}

module.exports = Request;