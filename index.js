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
var lora = require('./routes/lora');
var horses = require('./routes/horses');
var devices = require('./routes/devices');
var riders = require('./routes/riders');
var rides = require('./routes/rides');
var members = require('./routes/members');
var images = require('./routes/images');
var location = require('./routes/location');
var friends = require('./routes/friends');
var payments = require('./routes/payments');
var user = require('./routes/user');
var parkrides = require('./routes/parkrides');
var track = require('./routes/track');
var results = require('./routes/results');
var passport	= require('passport');
var elmicom = require('./addons/elmicom');
const fileUpload = require('express-fileupload');
var WebSockets = require("./utils/WebSockets.js").init();
var http = require("http");
var cors = require('cors')
const app = express();
app.use(cors());
const port = 3000;

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(passport.initialize());
app.use(fileUpload());

require('./config/passport')(passport);
var routes = require('./routes/router');

app.use('/', routes);
app.use('/lora', lora);
app.use('/events', events);
app.use('/elmicom', elmicom);
app.use('/horses', passport.authenticate('jwt', { session: false}), horses);
app.use('/devices', passport.authenticate('jwt', { session: false}), devices);
app.use('/riders', passport.authenticate('jwt', { session: false}), riders);
app.use('/rides', passport.authenticate('jwt', { session: false}), rides);
app.use('/members', passport.authenticate('jwt', { session: false}), members);
app.use('/location', location);
app.use('/friends', passport.authenticate('jwt', { session: false}), friends);
app.use('/payments', passport.authenticate('jwt', { session: false}), payments);
app.use('/user', passport.authenticate('jwt', { session: false}), user);
app.use('/parkrides', passport.authenticate('jwt', { session: false}), parkrides);
app.use('/track', passport.authenticate('jwt', { session: false}), track);
app.use('/results', results);
app.use('/images', images);

initDb({}, function (err) {

    const server = http.createServer(app);
    global.io = require("socket.io")(server);
    global.io.on("connection", WebSockets.connection);
  
    server.listen(port, function (err) {
        if (err) {
            throw err; //
        }
        console.log("API Up and running on port " + port);
    });
});
