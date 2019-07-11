const Request = require('./syntax/Request');
const sqlite = require('sqlite');
const Attribute = require('./syntax/Attribute');

class PEP {
    constructor(db) {
        this.db = db;
        this.request = new Request();
    }

    evalRequest(cb) {
        console.log(this.request.Subject.Attributes);
    }

    addUserAttributes(userid) {
        // Get all of the users attributes from database and add them to the current request
        console.log("Adding attributes for user " + userid);
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT ADef.name, ADef.datatype, AVal.value
                FROM AttributeValue AS AVal
                JOIN AttributeDef AS ADef
                ON AVal.attrid = ADef.id
                WHERE AVal.userid = ?
            `, userid, { Promise })
            .then(rows => {
                console.log("got rows: " + rows);
                rows.map(attr => this.request.addSubjectAttribute(new Attribute(attr.name, attr.datatype, attr.value)));
                resolve();
            })
            .catch(err => {reject("Could not get user attributes from database!")})
        });
    }

    addDeviceAttributes(deviceid) {
        // Get all of the devices attributes from database and add them to the current request
        console.log("Adding attributes for device " + deviceid);
        return this.db.all(`
            SELECT ADef.name, ADef.datatype, AVal.value
            FROM AttributeValue AS AVal
            JOIN AttributeDef AS ADef
            ON AVal.attrid = ADef.id
            WHERE AVal.deviceid = ?
        `, deviceid, { Promise })
            .then(rows => rows.map(attr => this.request.addResourceAttribute(new Attribute(attr.name, attr.datatype, attr.value))))
            .catch(err => {throw new Error("Could not get device attributes from database!")});
    }

}

module.exports = PEP;