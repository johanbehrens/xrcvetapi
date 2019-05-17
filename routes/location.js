var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
var { SendEmail } = require('../helpers/email');
const ISODate = Date;
const image2base64 = require('image-to-base64');
var { GetUserIds } = require('../helpers/user');
var { enqueue } = require('../helpers/jobqueue');
const async = require("async");

router.post('/', passport.authenticate('jwt', { session: false}), AddLocation);
router.get('/', passport.authenticate('jwt', { session: false}), GetLocations);
router.post('/update', passport.authenticate('jwt', { session: false}), GetLocationUpdate);
router.get('/liveUpdates/:raceid', GetLiveLocationsForRace);
router.get('/:id', passport.authenticate('jwt', { session: false}), GetLocation);
router.delete('/:id', passport.authenticate('jwt', { session: false}), DeleteLocation);

function GetLiveLocationsForRace(req, res) {
    var db = getDb();

    console.log('GetLiveLocationsForRace');
    db.collection('location').aggregate(raceLocationsAggregate(req.params.raceid)).toArray(function (err, locations) {
        console.log('return GetLiveLocationsForRace');
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            res.send(locations);
        }
    });
}

function DeleteLocation(req, res) {
    var db = getDb();
    console.log('DelLocation:' + req.params.id);
    db.collection('location').deleteOne({ _id: ObjectID(req.params.id) }, function (err, location) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else if (!location) res.send();
        else res.send();
    });
}

function GetLocationUpdate(req, res) {
    var db = getDb();

    console.log('GetLocationUpdate:' + req.body.id);
    if (!req.body.id) return res.send();
    db.collection('location').findOne({ _id: ObjectID(req.body.id) }, function (err, location) {
        console.log('return GetLocationUpdate:' + req.body.id);
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        if (!location) return res.send([]);

        res.send(location.locations.filter(loc => loc.timestamp > new Date(req.body.timestamp)));
    });
}

function GetLocation(req, res) {
    var db = getDb();

    console.log('GetLocation:' + req.params.id);
    if (!req.params.id || req.params.id == 'undefined') return res.send();
    db.collection('location').findOne({ _id: ObjectID(req.params.id) }, function (err, location) {

        console.log('return GetLocation:' + req.params.id);
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        if (!location) return res.send({});

        if (!location.imageId && location.userId.toString() == req.user._id.toString()) createStaticImage(location);

        location.edit = false;
        location.own = false;
        if (location.userId.toString() == req.user._id.toString()) {
            location.own = true;
            location.edit = true;
        }
        res.send(location);
    });
}

function GetLocations(req, res) {
    var db = getDb();
    GetUserIds(req.user._id, doGetLocations);

    function doGetLocations(userIds) {
        console.log('GetLocations');
        db.collection('location').aggregate(locationAggregate(userIds)).toArray(function (err, location) {
            console.log('return GetLocations');
            if (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            }
            else {
                location.map(l => {
                    l.edit = false;
                    l.own = false;
                    if (l.userId.toString() == req.user._id.toString()) {
                        l.own = true;
                        l.edit = true;
                    }
                });
                res.send(location);
            }
        });
    }
}

function createStaticImage(location) {
    if (location.locations && location.locations.length > 100) {
        var arr = [];
        var maxVal = 100;
        var delta = Math.floor(location.locations.length / maxVal);
        console.log(delta);
        for (i = 0; i < location.locations.length; i = i + delta) {
            arr.push(location.locations[i]);
        }
        location.locations = arr;
    }

    var path = location.locations.map(l => l.latitude + ',' + l.longitude).reduce((y, item) => y + '|' + item);
    var end = location.locations[location.locations.length - 1].odometer;
    let url = `http://maps.googleapis.com/maps/api/staticmap?key=AIzaSyA6Qwnkrpop_DzlDFWhI34bB7n8BXygxYg&size=300x300&path=${path}`;
    console.log(url);
    image2base64(url)
        .then(response => {
            var db = getDb();
            db.collection('profilepicture').insertOne({ image: response }, function (err, image) {
                imageId = image.ops[0]._id;
                db.collection('location').updateOne(
                    { locationRideId: location.locationRideId }, {
                        $set: {
                            imageId: imageId,
                            end
                        }
                    }, function (err, result) {
                        return;
                    })
            });
        }
        )
}

function AddLocation(req, res) {
    let locationRideId = req.headers.id;
    if (!locationRideId) return res.send();;
    var db = getDb();

    let type = req.headers.type;

    let username = req.headers.username;
    let horseId = ObjectID(req.headers.horseid);
    let riderId = ObjectID(req.headers.riderid);
    let raceId = req.headers.raceid;
    let riderNumber = req.headers.ridernumber;
    if (req.body.location) req.body = req.body.location;
    let userId = req.user._id;

    db.collection('location').findOne({ locationRideId: locationRideId }, function (err, location) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            if (!location) {
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
                db.collection('location').insertOne(loc, function (err, l) {

                    GetUserIds(req.user._id, doGetLocations);
                    function doGetLocations(userIds) {
                        async.each(userIds, function (id, callback) {
                            const notification = {
                                userId: id,
                                title: 'Friend Started Ride',
                                message: `${req.user.name} started a new ride`,
                                body: `${req.user.name} started a new ride`,
                                scheduledDate: new Date()
                            };

                            enqueue.sendPushNotification(notification, callback);
                        }, function (err) {
                            if (err) {
                                console.log(err);
                            }
                            res.send(l.ops[0]);
                        });
                    }
                })
            }
            else {
                if (!location) res.send({});

                db.collection('location').updateOne(
                    { locationRideId: locationRideId },
                    {
                        $push: {
                            locations: {
                                latitude: req.body[0],
                                longitude: req.body[1],
                                altitude: req.body[2],
                                speed: req.body[3],
                                level: req.body[4],
                                accuracy: req.body[5],
                                odometer: req.body[6],
                                timestamp: new ISODate(req.body[7]),
                                type
                            }
                        }
                    }, function (err, l) {
                        if (type === 'STOP' && location) {
                            createStaticImage(location, res);
                            delete location.locations;
                            res.send(location);
                        }
                        else if (type === 'SOS') {
                            SendEmail('behrens.johan@gmail.com', 'SOS - Help needed', `<html>There was a SOS sent at ${req.body[0]},${req.body[1]} <a href="https://www.google.com/maps/place/${req.body[0]},${req.body[1]}">Click Here</a></html>`);
                            res.send({ id: location._id });
                        }
                        else if (type === 'VET') {
                            SendEmail('behrens.johan@gmail.com', 'VET - Help needed', `<html>There was a VET sent at ${req.body[0]},${req.body[1]} <a href="https://www.google.com/maps/place/${req.body[0]},${req.body[1]}">Click Here</a></html>`);
                            res.send({ id: location._id });
                        }
                        else res.send({ id: location._id });
                    })

            }
        }

    });
}

function locationAggregate(Ids) {
    return [{
        $match: {
            userId: { $in: Ids }
        }
    },
    {
        $project: { locationRideId: 1, userId: 1, username: 1, horseId: 1, riderId: 1, raceId: 1, riderNumber: 1, date: 1, start: 1, end: 1, imageId: 1, trackId: 1 }
    },
    {
        $lookup: {
            "from": "rider",
            "localField": "riderId",
            "foreignField": "_id",
            "as": "rider"
        }
    },
    {
        $unwind: {
            path: "$rider"
        }
    },
    {
        $lookup: {
            "from": "horse",
            "localField": "horseId",
            "foreignField": "_id",
            "as": "horse"
        }
    },
    {
        $unwind: {
            path: "$horse"
        }
    },
    {
        $project: {
            locationRideId: 1, userId: 1, username: 1, horseId: 1, riderId: 1, raceId: 1, riderNumber: 1, date: 1, start: 1, end: 1,
            name: "$rider.name", surname: "$rider.surname", riderImageId: "$rider.imageId",
            hname: "$horse.name", horseImageId: "$horse.imageId",
            imageId: 1, trackId: 1
        }
    },
    {
        $sort: {
            date: -1
        }
    }
    ];

}

function raceLocationsAggregate(raceId) {
    return [{
        $match: {
            raceId: raceId,
            end: { $exists: false }
        }
    }, {
        $lookup: {
            "from": "rider",
            "localField": "riderId",
            "foreignField": "_id",
            "as": "rider"
        }
    }, {
        $project: {
            rider: 1, locations: { $slice: ["$locations", -3] }
        }
    }, {
        $unwind: {
            path: "$rider"
        }
    }];
}

module.exports = router;