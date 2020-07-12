var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
const parkrides = require('../helpers/parkrides');

router.post('/import', ImportRide);

function ImportRide(req, res) {
    var db = getDb();
    console.log('ImportRide');

    if (!req.body.description) return res.send({ error: 'Description is missing' });
    if (!req.body.category) return res.send({ error: 'Category is missing' });
    if (!req.body.raceId) return res.send({ error: 'RaceId is missing' });

    db.collection('location').findOne({ _id: ObjectID(req.body.raceId) }, function (err, location) {
        console.log('return GetLocation:' + req.body.raceId);
        if (err) return doError(err);
        if (!location) return res.send({ error: 'Race not found' });

        var importLocation = {
            category: req.body.category,
            description: req.body.description,
            locations: location.locations,
            start: location.date
        }

        getHorse(location.horseId, gotHorse);
        function gotHorse(err, horse) {
            if (err) return doError(err);
            importLocation.horseId = horse.parkrides.horse._id;
            getRider(location.riderId, gotRider);
        }
        function gotRider(err, rider) {
            if (err) return doError(err);
            importLocation.riderId = rider.parkrides.username;
            parkrides.importRide(importLocation, done);
        }
        function done(err, d) {
            if (err) return doError(err);
            if (d.error) return res.send(d);

            return db.collection('location').updateOne({ _id: ObjectID(req.body.raceId) }, {
                $set: {
                    parkridesTrackId: d.resultId
                }
            }, function (err) {
                if (err) return doError(err);
                res.send(d)
            });           
        }
    });

    function doError(err) {
        res.status(500);
        res.json({
            message: err.message,
            error: err
        });
    }
}

function getHorse(horseId, callback) {
    var db = getDb();
    db.collection('horse').findOne({ _id: horseId }, function (err, horse) {
        callback(err, horse);
    });
}

function getRider(riderId, callback) {
    var db = getDb();
    db.collection('rider').findOne({ _id: riderId }, function (err, rider) {
        callback(err, rider);
    });
}

module.exports = router;