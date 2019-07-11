const express = require('express')
const bodyParser = require('body-parser')
const sqlite = require('sqlite')
const Promise = require('bluebird')
const cors = require('cors')
const path = require('path')

const app = express();
const port = process.env.PORT || 3002;

const iotRoutes = require('./routes/iot');
const userRoutes = require('./routes/user');
const accessRoutes = require('./routes/access');

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/iot', iotRoutes);
app.use('/users', userRoutes);
app.use('/access', accessRoutes);

sqlite.open('./database.db', { Promise })
    .then(db => db.run("PRAGMA foreign_keys=ON", { Promise }))
    .then(() => sqlite.migrate({force:'last'}))
    .catch(err => console.log({error: err, at: 'database open/init'}));

app.listen(port);