var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
const ISODate = Date;

router.post('/', AddLocation);
router.get('/', GetLocations);
router.get('/:id', GetLocation);

function GetLocation(req, res) {
    var db = getDb();

    db.collection('location').findOne({_id: parseInt(req.params.id)}, function(err, doc){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else res.send(doc);
    });
}

function GetLocations(req, res) {
    var db = getDb();

    db.collection('location').find({}).sort( { date: -1 } ).toArray(function(err, doc){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else res.send(doc.map(l => { delete l.locations; return l; }));
    });
}

function AddLocation(req, res) {
    var db = getDb();

    let type = req.headers.type;
    let locationRideId = req.headers.id;
    let username = req.headers.username;
    let horseId = req.headers.horseid;
    let riderId = req.headers.riderid;
    let raceId = req.headers.raceid;
    let riderNumber = req.headers.ridernumber;
    if(req.body.location) req.body = req.body.location;
    let userId = req.user._id;

    db.collection('location').findOne({ locationRideId: locationRideId}, function(err, location){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else {
            if(!location){
                let loc = {
                    locationRideId,
                    userId,
                    username,
                    horseId,
                    riderId,
                    raceId,
                    riderNumber,
                    date: new ISODate(req.body[7]),
                    start: Number(req.body[6]),
                    locations: [{
                        latitude: Number(req.body[0]),
                        longitude: Number(req.body[1]),
                        altitude: Number(req.body[2]),
                        speed: Number(req.body[3]),
                        level: Number(req.body[4]),
                        accuracy: Number(req.body[5]),
                        odometer: Number(req.body[6]),
                        timestamp: new ISODate(req.body[7]),
                        type
                    }]
                };
                db.collection('location').insertOne(loc, function(err, location){
                    res.send(location.ops[0]);
                })
            }
            else {
                db.collection('location').updateOne(
                    { locationRideId: locationRideId },
                    { $push: { locations: {
                        latitude: req.body[0],
                        longitude: req.body[1],
                        altitude: req.body[2],
                        speed: req.body[3],
                        level: req.body[4],
                        accuracy: req.body[5],
                        odometer: req.body[6],
                        timestamp: new ISODate(req.body[7]),
                        type
                    } } }, function(err, location){
                        res.send(location.result);
                    })
                 
            }
        }
        
    });
}

module.exports = router;