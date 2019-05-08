var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
var {GetUserIds} = require('../helpers/user');

router.post('/', AddHorse);
router.get('/', GetHorses);
router.get('/:id', GetHorse);

function GetHorse(req, res) {
    var db = getDb();

    db.collection('horse').findOne({_id: parseInt(req.params.id)}, function(err, horse){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else {
            if (horse) {
                horse.own = horse.userId.toString() == req.user._id.toString();
                horse.edit = horse.own && (req.user.valid || horse.default);
            }
            res.send(horse);
        }
    });
}

function GetHorses(req, res) {
    var db = getDb();
    GetUserIds(req.user._id, doGetHorses)

    function doGetHorses(userIds) {
        console.log('GetHorses');
        db.collection('horse').find({ userId: { $in: userIds } }).toArray(function (err, doc) {
            console.log('return GetHorses');
            if (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            }
            else {
                doc.map(horse => {
                    horse.own = horse.userId.toString() == req.user._id.toString();
                    horse.edit = horse.own && (req.user.valid || horse.default);
                });
                res.send(doc);
            }
        });
    }
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