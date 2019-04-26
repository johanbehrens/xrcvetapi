var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
var {GetUserIds} = require('../helpers/user');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;

router.post('/', AddRider);
router.get('/', GetRiders);
router.get('/:id', GetRider);

function GetRider(req, res) {
    var db = getDb();

    db.collection('rider').findOne({ _id: parseInt(req.params.id) }, function (err, rider) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            if (rider) {
                rider.edit = false;
                if (req.user.subscription == 0 && rider.userId == req.user._id && rider.default == true) {
                    rider.edit = true;
                }
                if (req.user.subscription == 1 && rider.userId == req.user._id) {
                    rider.edit = true;
                }
            }
            res.send(rider);
        }
    });
}

function GetRiders(req, res) {
    var db = getDb();
    GetUserIds(req.user._id, doGetRiders)

    function doGetRiders(userIds) {
        console.log('GetRiders');
        db.collection('rider').find({ userId: { $in: userIds } }).toArray(function (err, doc) {
            console.log('return GetRiders');
            if (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            }
            else {
                doc.map(rider => {
                    rider.edit = false;
                    rider.own = false;
                    if (rider.userId.toString() == req.user._id.toString()) {
                        rider.own = true;
                        if (req.user.subscription == 1) {
                            rider.edit = true;
                        }
                        else if (rider.default == true) {
                            rider.edit = true;
                        }
                    }
                });
                res.send(doc);
            }
        });
    }
}

function AddRider(req, res) {
    var db = getDb();

    req.body._id = new ObjectID(req.body._id);
    req.body.userId = req.user._id;

    db.collection('rider').findOne({ _id: req.body._id }, function (err, rider) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            if (!rider) {
                db.collection('rider').insertOne(req.body, function (err, rider) {
                    res.send(rider.ops[0]);
                })
            }
            else {
                db.collection('rider').replaceOne({ _id: req.body._id }, req.body, function (err, rider) {
                    res.send(rider.ops[0]);
                })
            }
        }

    });
}

module.exports = router;