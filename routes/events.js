var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);

router.post('/', passport.authenticate('jwt', { session: false}), AddEvent);
router.get('/', GetEvents);
router.get('/:id', GetEvent);

function GetEvent(req, res) {
    var db = getDb();

    db.collection('event').findOne({old_id: parseInt(req.params.id)}, function(err, doc){
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

function GetEvents(req, res) {
    var db = getDb();

    db.collection('event').find({}).toArray(function(err, doc){
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

function AddEvent(req, res) {
    var db = getDb();
    db.collection('event').insertOne(req.body, function(err, doc){
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

module.exports = router;