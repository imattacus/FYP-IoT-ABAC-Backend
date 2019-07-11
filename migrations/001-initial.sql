-- Up
CREATE TABLE Household (
    id INTEGER PRIMARY KEY,
    name TEXT
);

CREATE TABLE User (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE
    -- householdid INTEGER NOT NULL,
    -- FOREIGN KEY(householdid) REFERENCES Household(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Device (
    id INTEGER PRIMARY KEY,
    name TEXT,
    status NUMERIC NOT NULL DEFAULT 0,
    ownerid INTEGER,
    FOREIGN KEY(ownerid) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Groups (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    admin INTEGER NOT NULL,
    FOREIGN KEY(admin) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE GroupSubscription (
    groupid INTEGER NOT NULL,
    userid INTEGER,
    deviceid INTEGER,
    PRIMARY KEY(groupid, userid, deviceid),
    FOREIGN KEY(groupid) REFERENCES Groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(userid) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(deviceid) REFERENCES Device(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE AttributeDef (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    prettyname TEXT,
    datatype TEXT,
    groupid INTEGER NOT NULL,
    FOREIGN KEY(groupid) REFERENCES Groups(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE AttributeValue (
    attrid INTEGER NOT NULL,
    value TEXT,
    appliesto TEXT NOT NULL,
    userid INTEGER,
    deviceid INTEGER,
    UNIQUE(attrid, userid),
    UNIQUE(attrid, deviceid),
    FOREIGN KEY(userid) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(deviceid) REFERENCES Device(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE GroupRequest (
    id INTEGER PRIMARY KEY,
    fromuser INTEGER NOT NULL,
    fromusername TEXT,
    touser INTEGER NOT NULL,
    groupid INTEGER NOT NULL,
    groupname TEXT,
    deviceid INTEGER,
    devicename TEXT,
    purpose TEXT NOT NULL,
    FOREIGN KEY(fromuser) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(touser) REFERENCES User(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(groupid) REFERENCES Groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(deviceid) REFERENCES Device(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(touser, groupid, purpose),
    UNIQUE(touser, groupid, deviceid, purpose)
);


-- Down
DROP TABLE Household;
DROP TABLE User;
DROP TABLE Device;
DROP TABLE Group;
DROP TABLE GroupSubscription;
DROP TABLE AttributeDef;
DROP TABLE AttributeValue;
DROP TABLE GroupRequest;