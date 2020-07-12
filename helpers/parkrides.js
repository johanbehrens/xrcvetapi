const rp = require('request-promise');
const getDb = require("../db").getDb;
var ObjectID = require('mongodb').ObjectID;
const baseURL = 'http://209.97.178.43/api';
//const baseURL = 'http://localhost:8080/api';
var token;

function register(userId, riderId, username, password, callback) {
    var data = { username, password };
    var url = baseURL + '/auth/login';
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        body: data,
        url,
        json: true
    };
    rp(options)
        .then(function (d) {
            if (d.error) return callback(d.error);
            if (!d.token) return callback('Something went wrong, please try again');

            token = d.token;
            getProfile(next);

            function next(err, profile) {
                if (err) return callback(err);

                var db = getDb();
                db.collection('rider').updateOne(
                    { _id: new ObjectID(riderId), userId },
                    {
                        $set: {
                            parkrides: { name: profile.name, surname: profile.surname, username: profile.username }
                        }
                    }, function (err, l) {
                        if (d.error) return callback(err);
                        return callback();
                    });
            }
        })
        .catch(function (err) {
            console.log(err);
            return callback(err);
        });
}

function importRide(location, callback) {
    login(location.riderId, doImport);
    function doImport(err) {
        if (err) callback(err);
        var data = location;
        var url = baseURL + '/results/import';
        let options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Authorization': token,
            },
            body: data,
            url,
            json: true
        };
        rp(options)
            .then(function (d) {
                console.log(d);
                return callback(null, d);
            })
            .catch(function (err) {
                console.log(err);
                return callback(err);
            });
    }
}

function login(username, callback) {
    var data = { username };
    var url = baseURL + '/auth/apilogin';
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        body: data,
        url,
        json: true
    };
    rp(options)
        .then(function (d) {
            if (d.error) return callback(d.error);
            token = d.token;
            console.log(d);
            return callback();
        })
        .catch(function (err) {
            console.log(err);
            return callback(err.statusMessage);
        });
}

function getProfile(callback) {
    GET(`${baseURL}/people/profile`, callback);
}

function getHorses(callback) {
    GET(`${baseURL}/horses`, callback);
}

function getAllUsers(userId, callback) {
    var db = getDb();
    db.collection('rider').find({ userId, parkrides: { $exists: true } }).toArray(function (err, riders) {
        if (err) return callback(err);

        var parkrideUsers = [];
        riders.forEach(rider => {
            parkrideUsers.push(rider.parkrides);
        });
        console.log(parkrideUsers);
        return callback(err, parkrideUsers);
    });
}

function GET(url, callback) {
    let options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        url,
        json: true
    };

    rp(options)
        .then(function (d) {
            if (d.error) return callback(d.error);
            console.log(d);
            return callback(null, d);
        })
        .catch(function (err) {
            //console.log(err);
            return callback(err.statusMessage);
        });
}

module.exports = {
    register,
    login,
    getProfile,
    getHorses,
    getAllUsers,
    importRide
}
