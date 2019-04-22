var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;

router.post('/', AddHorse);
router.get('/', GetHorses);
router.get('/:id', GetHorse);

function GetHorse(req, res) {
    var db = getDb();

    db.collection('horse').findOne({_id: parseInt(req.params.id)}, function(err, doc){
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

function GetHorses(req, res) {
    var db = getDb();

    db.collection('horse').find({userId: req.user._id}).toArray(function(err, doc){
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

function AddHorse(req, res) {
    var db = getDb();

    req.body._id = new ObjectID(req.body._id);
    req.body.userId = req.user._id;

    db.collection('horse').findOne({_id: req.body._id}, function(err, horse){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else {
            if(!horse){
                db.collection('horse').insertOne(req.body, function(err, horse){
                    res.send(horse.ops[0]);
                })
            }
            else {
                db.collection('horse').replaceOne({_id: req.body._id},req.body, function(err, horse){
                    res.send(horse.ops[0]);
                })
            }
        }
        
    });
}

module.exports = router;