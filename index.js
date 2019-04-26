 /*
    "bcrypt": "^0.8.5",
    "body-parser": "~1.9.2",
    "epson-thermal-printer": "^1.0.0",
    "express": "~4.9.8",
    "js-crc": "^0.2.0",
    "jwt-simple": "^0.3.1",
    "mongoose": "~4.2.4",
    "morgan": "~1.5.0",
    "net": "^1.0.2",
    "node-dbf": "^0.2.1",
    "node-rest-client": "^3.1.0",
    "node-thermal-printer": "^1.1.1",
    "passport": "^0.3.0",
    "passport-jwt": "^1.2.1",
    "raw-socket": "^1.5.2",
    "read-dir-files": "^0.1.1",
    "serialport": "^6.0.5"*/

const express = require('express');
const initDb = require("./db").initDb;

var bodyParser = require('body-parser');
var events = require('./routes/events');
var horses = require('./routes/horses');
var riders = require('./routes/riders');
var rides = require('./routes/rides');
var images = require('./routes/images');
var location = require('./routes/location');
var friends = require('./routes/friends');
var passport	= require('passport');
const fileUpload = require('express-fileupload');
const getDb = require("./db").getDb;
var cors = require('cors')
const app = express();
app.use(cors());
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(fileUpload());

require('./config/passport')(passport);
var routes = require('./routes/router');

app.use('/', routes);
app.use('/events', passport.authenticate('jwt', { session: false}), events);
app.use('/horses', passport.authenticate('jwt', { session: false}), horses);
app.use('/riders', passport.authenticate('jwt', { session: false}), riders);
app.use('/rides', passport.authenticate('jwt', { session: false}), rides);
app.use('/location', passport.authenticate('jwt', { session: false}), location);
app.use('/friends', passport.authenticate('jwt', { session: false}), friends);
app.use('/images', images);

initDb(function (err) {
    app.listen(port, function (err) {
        if (err) {
            throw err; //
        }
        console.log("API Up and running on port " + port);
    });
});
