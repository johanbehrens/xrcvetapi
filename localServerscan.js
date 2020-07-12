const parkrides = require('./helpers/parkrides');
var ObjectID = require('mongodb').ObjectID;
const initDb = require("./db").initDb;

initDb({}, function (err) {
parkrides.login('8506145060081', next);
});

function next(err) {
    if (err) console.log(err);
    parkrides.getAllUsers(ObjectID('5dfeee2992a63ef34ee57cba'), nextnext);
}

function nextnext(err, riders) {
    if (err) console.log(err);
    riders.forEach(rider => {
        parkrides.getHorses()
    });
}