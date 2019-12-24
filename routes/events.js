var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var fetch = require('node-fetch');

router.post('/', passport.authenticate('jwt', { session: false }), AddEvent);
router.post('/:id/', passport.authenticate('jwt', { session: false }), AddEventItem);

router.get('/', GetEvents);
router.get('/:id', GetEvent);
router.get('/import', passport.authenticate('jwt', { session: false }), ImportEvents);

function ImportEvents(req, res) {
    fetch('http://xrc.co.za/Objects/ride_func.php', {
        method: "POST",
        body: JSON.stringify({ function: 'getRides', offset: 0, limit: 18 })
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (events) {
            db.collection('event').insertMany(events, function (err, doc) {
                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else res.send(doc);
            });
        }).catch(function (err) {
            res.send(err);
        });
}

function GetEvent(req, res) {
    var db = getDb();

    db.collection('event').findOne({ old_id: parseInt(req.params.id) }, function (err, doc) {
        if (err) {
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
    db.collection('event').find({}).sort({ start: -1 }).toArray(function (err, doc) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            doc.map(m => {
                let eventDate = new Date(m.start).toISOString().split('T')[0];
                let today = new Date().toISOString().split('T')[0];
                m.live = eventDate == today;
            });
            res.send(doc);
        }
    });
}

function AddEvent(req, res) {
    var db = getDb();
    var event ={
        ...req.body,
        start: req.body.date,
        end: req.body.date
    }
    db.collection('event').insertOne(event, function (err, doc) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else res.send(doc);
    });
}

function AddEventItem(req, res) {
    var db = getDb();
    db.collection('eventItem').insertOne(req.body, function (err, doc) {
        if (err) {
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