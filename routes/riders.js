var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;

router.post('/', AddRider);
router.get('/', GetRiders);
router.get('/:id', GetRider);

function GetRider(req, res) {
    var db = getDb();

    db.collection('rider').findOne({_id: parseInt(req.params.id)}, function(err, doc){
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

function GetRiders(req, res) {
    var db = getDb();

    db.collection('rider').find({}).toArray(function(err, doc){
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

function AddRider(req, res) {
    var db = getDb();

    req.body._id = new ObjectID(req.body._id);

    db.collection('rider').findOne({_id: req.body._id}, function(err, rider){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else {
            if(!rider){
                db.collection('rider').insertOne(req.body, function(err, rider){
                    res.send(rider.ops[0]);
                })
            }
            else {
                db.collection('rider').replaceOne({_id: req.body._id},req.body, function(err, rider){
                    res.send(rider.ops[0]);
                })
            }
        }
        
    });
}

module.exports = router;