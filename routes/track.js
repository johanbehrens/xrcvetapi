var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;

router.post('/', passport.authenticate('jwt', { session: false }), CreateTrack);
router.get('/:id', GetTrack);

function GetTrack(req, res) {
    var db = getDb();

    db.collection('track').findOne({ _id: ObjectID(req.params.id) }, function (err, track) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else res.send(track);
    });
}

function CreateTrack(req, res) {
    var db = getDb();
    db.collection('location').findOne({ _id: ObjectID(req.body.locationid) }, function (err, location) {

        let track = {
            userId: req.user._id,
            name: req.body.name,
            locations: location.locations.map(l => {
                return {
                    latitude: l.latitude,
                    longitude: l.longitude
                }
            })
        }

        db.collection('track').insertOne(track, function (err, trackIn) {
            if (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            }
            db.collection('location').updateOne(
                { _id: ObjectID(req.body.locationid) },
                {
                    $set: {
                        trackId: trackIn.ops[0]._id
                    }
                }, function (err, d) {
                    res.send({trackId: trackIn.ops[0]._id});
                });
        });
    });
}

module.exports = router;