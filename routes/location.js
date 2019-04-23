var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
var { SendEmail }	= require('./email');
const ISODate = Date;
const image2base64 = require('image-to-base64');

router.post('/', AddLocation);
router.get('/', GetLocations);
router.get('/:id', GetLocation);
router.delete('/:id', DeleteLocation);

function DeleteLocation(req, res) {
    var db = getDb();
    console.log('DelLocation:'+req.params.id);
    db.collection('location').deleteOne({_id: ObjectID(req.params.id)}, function(err, location){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else if(!location) res.send();
        else res.send();
    });
}

function GetLocation(req, res) {
    var db = getDb();

    console.log('GetLocation:'+req.params.id);
    if(!req.params.id || req.params.id=='undefined') return res.send();
    db.collection('location').findOne({_id: ObjectID(req.params.id)}, function(err, location){
        console.log('return GetLocation:'+req.params.id);
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else {
            if(!location.imageId) createStaticImage(location, res);
            else res.send(location);}
    });
}

function GetLocations(req, res) {
    var db = getDb();
    db.collection('location').find({userId: req.user._id}).sort( { date: -1 } ).toArray(function(err, doc){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        res.send(doc.map(l => { delete l.locations; return l; }));
    });
}



function createStaticImage(location, res) {
    if(location.locations && location.locations.length > 100) {
        var arr = [];
        var maxVal = 100;
        var delta = Math.floor( location.locations.length / maxVal );
        console.log(delta);
        for (i = 0; i < location.locations.length; i=i+delta) {
            arr.push(location.locations[i]);
        }
        location.locations = arr;
    }

    var path = location.locations.map(l => l.latitude+','+l.longitude).reduce((y,item) => y+'|'+item);
    let url = `http://maps.googleapis.com/maps/api/staticmap?key=AIzaSyA6Qwnkrpop_DzlDFWhI34bB7n8BXygxYg&size=300x300&path=${path}`;
console.log(url);
    image2base64(url)
    .then(response => {
            var db = getDb();
            db.collection('profilepicture').insertOne({image: response}, function(err, image){
                imageId = image.ops[0]._id;
                db.collection('location').updateOne(
                    { locationRideId: location.locationRideId },{$set :{
                        imageId:imageId, 
                        end: location.odometer
                    }}, function(err, result) {
                        res.send(result);
                    })
            });
        }
    )
}

function AddLocation(req, res) {
    let locationRideId = req.headers.id;
    if(!locationRideId) return res.send();;
    var db = getDb();

    let type = req.headers.type;
    
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
                        if(type === 'STOP' && location){
                            createStaticImage(location, res)
                        }
                        else if(type === 'SOS') {
                            SendEmail('behrens.johan@gmail.com','SOS - Help needed',`<html>There was a SOS sent at ${req.body[0]},${req.body[1]} <a href="https://www.google.com/maps/place/${req.body[0]},${req.body[1]}">Click Here</a></html>`);
                            res.send(l);
                        }
                        else if(type === 'VET') {
                            SendEmail('behrens.johan@gmail.com','VET - Help needed',`<html>There was a VET sent at ${req.body[0]},${req.body[1]} <a href="https://www.google.com/maps/place/${req.body[0]},${req.body[1]}">Click Here</a></html>`);
                            res.send(l);
                        }
                        else res.send(l);
                    })
                 
            }
        }
        
    });
}

module.exports = router;