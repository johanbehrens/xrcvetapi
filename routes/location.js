var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
const ISODate = Date;
const image2base64 = require('image-to-base64');

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

        /*
        doc.map(location =>{
            var path = location.locations.map(l => l.latitude+','+l.longitude).reduce((y,item) => y+'|'+item);
                            image2base64(`http://maps.googleapis.com/maps/api/staticmap?key=AIzaSyA6Qwnkrpop_DzlDFWhI34bB7n8BXygxYg&size=300x300&path=${path}`) 
                            .then(response => {
                                    var db = getDb();
                                    db.collection('profilepicture').insertOne({image: response}, function(err, image){
                                        imageId = image.ops[0]._id;
                                        db.collection('location').updateOne(
                                            { locationRideId: location.locationRideId },{$set :{imageId:imageId}}, function(err, result) {
                                                //res.send(result);
                                            })
                                    });
                                }
                            )
        });
*/
        res.send(doc.map(l => { delete l.locations; return l; }));
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
            if(!location && type == "START"){
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
                db.collection('location').insertOne(loc, function(err, l){
                    res.send(l.ops[0]);
                })
            }
            else {
                if(!location) res.send({});
                
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
                    } } }, function(err, l){
                        if(type === 'STOP'){
                            var path = location.locations.map(l => l.latitude+','+l.longitude).reduce((y,item) => y+'|'+item);
                            image2base64(`http://maps.googleapis.com/maps/api/staticmap?key=AIzaSyA6Qwnkrpop_DzlDFWhI34bB7n8BXygxYg&size=300x300&path=${path}`) 
                            .then(response => {
                                    var db = getDb();
                                    db.collection('profilepicture').insertOne({image: response}, function(err, image){
                                        imageId = image.ops[0]._id;
                                        db.collection('location').updateOne(
                                            { locationRideId: locationRideId },{$set :{imageId:imageId}}, function(err, result) {
                                                res.send(result);
                                            })
                                    });
                                }
                            )
                        }
                    })
                 
            }
        }
        
    });
}

module.exports = router;