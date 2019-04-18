var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;

router.post('/', AddRide);
router.get('/', GetRides);
router.get('/:id', GetRide);

function GetRide(req, res) {
    var db = getDb();

    db.collection('ride').findOne({_id: parseInt(req.params.id)}, function(err, doc){
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

function GetRides(req, res) {
    var db = getDb();

    db.collection('ride').find({}).toArray(function(err, doc){
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

function AddRide(req, res) {
    var db = getDb();

    req.body._id = new ObjectID(req.body._id);

    db.collection('ride').findOne({_id: req.body._id}, function(err, ride){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else {
            if(!ride){
                db.collection('ride').insertOne(req.body, function(err, ride){
                    res.send(ride.ops[0]);
                })
            }
            else {
                db.collection('ride').replaceOne({_id: req.body._id},req.body, function(err, ride){
                    res.send(ride.ops[0]);
                })
            }
        }
        
    });
}

module.exports = router;