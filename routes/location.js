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
const user = require('../helpers/user');

router.post('/', passport.authenticate('jwt', { session: false }), AddLocation);
router.get('/', passport.authenticate('jwt', { session: false }), GetLocations);

router.post('/:id/reactions', passport.authenticate('jwt', { session: false }), DoReactions);
router.get('/:id/reactions', passport.authenticate('jwt', { session: false }), GetReactions);
router.post('/update', passport.authenticate('jwt', { session: false }), GetLocationUpdate);

router.get('/liveUpdates/:raceid', GetLiveLocationsForRace);
router.get('/liveUpdates/tracks/:id', GetLiveTracksForRace);
router.get('/:id', passport.authenticate('jwt', { session: false }), GetLocation);
router.delete('/:id', passport.authenticate('jwt', { session: false }), DeleteLocation);

function GetLiveTracksForRace(req, res) {
    var db = getDb();

    console.log('GetLiveTracksForRace:' + req.params.id);
    if (!req.params.id) return res.send();
    db.collection('event').findOne({ id: req.params.id }, function (err, event) {
        console.log('return GetLiveTracksForRace:' + req.params.id);
        if (!event) return res.send();
        if (!event.legs) return res.send();

        let tracks = [];
        async.each(event.legs, function (leg, callback) {
            db.collection('track').findOne({ _id: leg.trackId }, function (err, track) {
                tracks.push(track);
                callback();
            });
        }, function (err) {
            if (err) {
                console.log(err);
            }
            res.send(tracks);
        });
    });
}

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
        if (!location.locations) return res.send([]);

        res.send(location.locations.filter(loc => loc.timestamp > new Date(req.body.timestamp)));
    });
}

function DoReactions(req, res) {
    var db = getDb();

    console.log('DoReaction:',req.params.id,req.body.reaction);

    db.collection('location').findOne({ _id: ObjectID(req.params.id) }, function (err, location) {
        if (err) {
            res.status(500);
            return res.json({
                message: err.message,
                error: err
            });
        }
        else if (location.reactions) {
            let myReaction = location.reactions.find(i => i.userId.toString() === req.user._id.toString());
            if (myReaction) myReaction.reaction = req.body.reaction;
            db.collection('location').updateOne(
                { _id: ObjectID(req.params.id) }, {
                $set: {
                    reactions: location.reactions
                }
            }, function (err, result) {
                if (err) {
                    res.status(500);
                    return res.json({
                        message: err.message,
                        error: err
                    });
                }
                return res.send(location.reactions);
            });
        }
        else {
            let newReaction = {
                reaction: req.body.reaction,
                userId: req.user._id
            }
            db.collection('location').updateOne(
                { _id: ObjectID(req.params.id) }, {
                $push: {
                    reactions: newReaction
                }
            }, function (err, result) {
                if (err) {
                    res.status(500);
                    return res.json({
                        message: err.message,
                        error: err
                    });
                }
                return res.send([newReaction]);
            });
        }
    });
}

function GetReactions(req, res) {
    var db = getDb();

    console.log('GetReactions:' + req.body.id);

    db.collection('location').findOne({ _id: ObjectID(req.params.id) }, function (err, location) {
        if (err) {
            res.status(500);
            return res.json({
                message: err.message,
                error: err
            });
        }
        else return res.send(location.reactions);
    });
}

function GetLocation(req, res) {
    var db = getDb();

    console.log('GetLocation:' + req.params.id);
    if (!req.params.id || req.params.id == 'undefined') return res.send();


    var db = getDb();

    console.log('GetLiveLocationsForRace');
    db.collection('location').aggregate(privateLocationAggregate(req.params.id)).toArray(function (err, locations) {

        var location = locations[0];
        // db.collection('location').findOne({ _id: ObjectID(req.params.id) }, function (err, location) {

        console.log('return GetLocation:' + req.params.id);
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        if (!location) return res.send({});

        if (!location.imageId && location.userId && location.userId.toString() == req.user._id.toString()) createStaticImage(location, req, res);

        location.edit = false;
        location.own = false;
        if (location.userId && location.userId.toString() == req.user._id.toString()) {
            location.own = true;
            location.edit = true;
        }

        delete location.locations;
        res.send(location);
    });
}

function GetLocations(req, res) {
    console.log('GetLocations');
    user.GetHistory(req.user._id, doGetLocations)

    function doGetLocations(err, locations) {
        if (err) {
            res.status(500);
            return res.json({
                message: err.message,
                error: err
            });
        }
        return res.send(locations);
    }
}

function getGoogleImageandSave(location) {
    if (location && location.locations && location.locations.length > 100) {
        var arr = [];
        var maxVal = 100;
        var delta = Math.floor(location.locations.length / maxVal);
        console.log(delta);
        for (i = 0; i < location.locations.length; i = i + delta) {
            arr.push(location.locations[i]);
        }
        location.locations = arr;
    }

    if (location) {
        var path = location.locations.map(l => l.latitude + ',' + l.longitude).reduce((y, item) => y + '|' + item);
        var end = location.locations[location.locations.length - 1].odometer;
        let url = `http://maps.googleapis.com/maps/api/staticmap?key=AIzaSyA6Qwnkrpop_DzlDFWhI34bB7n8BXygxYg&size=900x300&path=${path}`;
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
                        if (err) console.log(err);
                        return;
                    })
                });
            }
            )
    }
}

function createStaticImage(location, req, res) {
    var db = getDb();
    if (location) {
        db.collection('location').findOne({ _id: location._id }, function (err, location) {
            if (err) {
                return console.log('Error creating image', err);
            }
            getGoogleImageandSave(location);
        });
    }
    //else get last location for user and create image
    else {
        let userId = req.user._id;

        db.collection('location').findOne({ userId, imageId: { $exists: false } }, function (err, location) {
            if (err) {
                return console.log('Error creating image', err);
            }
            getGoogleImageandSave(location);
        });
    }

}

function AddLocation(req, res) {

    if (!req.body.location) {
        console.log(req.headers.username + " location update FAILED 1", req.body);
        return res.send({});
    }

    let extras = {};
    if (req.body.location[8]) extras = req.body.location[8];

    let locationRideId = extras.uuid ? extras.uuid : req.headers.id;
    if (!locationRideId) {
        if (extras && extras.type == 'STOP') createStaticImage(null, req, res);
        console.log(req.headers.username + " location update FAILED 2", req.body.location);
        return res.send();
    }

    var db = getDb();

    let type = extras.type ? extras.type : req.headers.type;
    console.log(req.headers.username + " location update", req.body.location, type);
    let username = req.headers.username;

    let horseId = extras.horseId ? ObjectID(extras.horseId) : ObjectID(req.headers.horseid);
    let riderId = extras.riderId ? ObjectID(extras.riderId) : ObjectID(req.headers.riderid);
    let raceId = extras.raceId ? extras.raceId : req.headers.raceid;
    delete req.body.location[8];

    let riderNumber = extras.riderNumber ? extras.riderNumber : req.headers.ridernumber;
    let raceType = extras.raceType ? extras.raceType : req.headers.raceType;

    if (req.body.location) req.body = req.body.location;
    let userId = req.user._id;

    let toMatch = {
        locationRideId
    }

    if (raceId) {
        toMatch = {
            raceId,
            type: raceType,
            riderNumber
        }
    }

    db.collection('location').findOne(toMatch, function (err, location) {
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
                    type: raceType,
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
                if (!location) return res.send({});

                if (Number(req.body[5]) > 20) return res.send({ id: location._id });
                db.collection('location').updateOne(
                    toMatch,
                    {
                        $set: {
                            locationRideId,
                            userId,
                            username,
                            horseId,
                            riderId,
                        },
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
                            createStaticImage(location, req, res);
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

function raceLocationsAggregate(raceId) {
    return [{
        $match: {
            raceId
        }
    }, {
        $project: {
            rider: 1,
            locations: { $slice: ["$locations", -3] },
            raceId: 1,
            riderNumber: 1,
            date:1,
            type: 1,
            diff:1,
            AVE_SPD: 1,
            ARRIVAL1:1,
            ARRIVAL2:1,
            ARRIVAL3:1,
            ARRIVAL4:1,
            ARRIVAL5:1,
            ARRIVAL6:1,
            CALLNAME: 1,
            CCODE:1,
            CAT: 1,
            DAYNO: 1,
            DLEG1:1,
            DLEG2:1,
            DLEG3:1,
            DLEG4:1,
            DLEG5:1,
            DLEG6:1,
            DISQ: 1,
            DIST: 1,
            FNAME: 1,
            HCODE: 1,
            HNAME: 1,
            MCODE: 1,
            PULSE1: 1,
            PULSE2: 1,
            PULSE3: 1,
            PULSE4: 1,
            PULSE5: 1,
            PULSE6: 1,
            REASON: 1,
            R_TIME1: 1,
            R_TIME2: 1,
            R_TIME3: 1,
            R_TIME4: 1,
            R_TIME5: 1,
            R_TIME6: 1,
            COL_LEG1: 1,
            COL_LEG2: 1,
            COL_LEG3: 1,
            COL_LEG4: 1,
            COL_LEG5: 1,
            COL_LEG6: 1,
            SPEED1: 1,
            SPEED2: 1,
            SPEED3: 1,
            SPEED4: 1,
            SPEED5: 1,
            SPEED6: 1,
            SLIP1: 1,
            SLIP2: 1,
            SLIP3: 1,
            SLIP4: 1,
            SLIP5: 1,
            SLIP6: 1,
            TIME1: 1,
            TIME10: 1,
            TIME11: 1,
            TIME12: 1,
            TIME2: 1,
            TIME3: 1,
            TIME4: 1,
            TIME5: 1,
            TIME6: 1,
            TIME7: 1,
            TIME8: 1,
            TIME9: 1,
            TOTSLIP: 1,
            TOT_TIME: 1,
        }
    },{
        $sort: {
            date: 1, CAT: 1, TOT_TIME: -1
        }
    }];
}

function privateLocationAggregate(locationId) {
    return [{
        $match: {
            _id: ObjectID(locationId)
        }
    }, {
        $unwind: {
            path: "$locations"
        }
    },
    {
        $group: {
            _id: {
                id: "$_id", userId: "$userId", username: "$username", horseId: "$horseId", riderId: "$riderId", raceId: "$raceId",
                riderNumber: "$riderNumber",
                date: "$date",
                start: "$start",
                imageId: "$imageId",
                trackId: "$trackId"
            },
            minAltitude: { $min: "$locations.altitude" },
            maxAltitude: { $max: "$locations.altitude" },
            minDate: { $min: "$locations.timestamp" },
            maxDate: { $max: "$locations.timestamp" },
            maxSpeed: { $max: "$locations.speed" },
            start: { $min: "$locations.odometer" },
            end: { $max: "$locations.odometer" },


        }
    },
    {
        $project: {
            _id: false,
            _id: "$_id.id",
            userId: "$_id.userId",
            username: "$_id.username",
            horseId: "$_id.horseId",
            riderId: "$_id.riderId",
            raceId: "$_id.raceId",
            riderNumber: "$_id.riderNumber",
            date: "$_id.date",
            start: "$_id.start",
            imageId: "$_id.imageId",
            trackId: "$_id.trackId",
            minAlt: "$minAltitude",
            maxAlt: "$maxAltitude",
            maxSpeed: "$maxSpeed",
            distance: { $subtract: ["$end", "$start"] },
            time: { $subtract: ["$maxDate", "$minDate"] }
        }
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
        $lookup: {
            "from": "horse",
            "localField": "horseId",
            "foreignField": "_id",
            "as": "horse"
        }
    },
    {
        $unwind: {
            path: "$rider"
        }
    },
    {
        $unwind: {
            path: "$horse"
        }
    },
    ];
}

module.exports = router;