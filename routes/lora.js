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

router.post('/', AddLocation);

function AddLocation(req, res) {
    var db = getDb();

    console.log('Lora', req.body);


    db.collection('lora').insertOne(req.body, function (err, trackIn) {
        if (err) {
            console.log(err);
        }
        else{
            AddLocationPoint(req.body);
        }
        res.send();
    });
}

function AddLocationPoint(loc) {
    var db = getDb();
    db.collection('loraMap').findOne({ hardware_serial:loc.hardware_serial }, function (err, map) {
        console.log(map);

        if (!map) return;

        toMatch = {
            raceId: map.raceId,
            type: map.type,
            riderNumber: map.riderNumber
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
                if (!location) return;

                db.collection('location').updateOne(
                    toMatch,
                    {
                        $push: {
                            locations: {
                                latitude: loc.payload_fields.latitudeDeg,
                                longitude: loc.payload_fields.longitudeDeg,
                                altitude: 0,
                                speed: loc.payload_fields.speedKmph,
                                level: 0,
                                accuracy: 0,
                                odometer: 0,
                                timestamp: loc.metadata.time,
                                type: 'WATCH'
                            }
                        }
                    }, function (err, l) {
                        console.log('added LORA Locations');
                    })
            }

        });
    });
}

module.exports = router;
