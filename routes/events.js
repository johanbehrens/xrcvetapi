var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
var moment = require('moment');
require('../config/passport')(passport);
var fetch = require('node-fetch');
const rp = require('request-promise');
const async = require('async');
const sites = require('../helpers/sites');
const user = require('../helpers/user');

router.post('/', passport.authenticate('jwt', { session: false }), AddEvent);
router.post('/:id/', passport.authenticate('jwt', { session: false }), AddEventItem);

router.get('/', passport.authenticate('jwt', { session: false }), GetEvents);
router.get('/:id', GetEvent);
router.get('/:type/entries/:id', GetEventEntries);
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

function GetEventEntries(req, res) {
    console.log('GetEventEntries');

    sites.getEntries(req.params.type, req.params.id, done);

    function done(err, results) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            res.send(results);
        }
    }
}

function GetEvents(req, res) {
    
    req.query.page = parseInt(req.query.page) + 1;
    let start = 0;
    let end = req.query.page * 20;
    if (end > 0) {
        start = end - 20;
    }
    else {
        end = 20;
    }
    console.log('GetEvents',start,end);

    let functionList = {
        ERASA: async.apply(sites.getEvents, 'ERASA'),
        DRASA: async.apply(sites.getEvents, 'DRASA'),
        NAMEF: async.apply(sites.getEvents, 'NAMEF'),
        PRIVATE: async.apply(user.GetHistory, req.user._id)
    };

    async.parallel(functionList, formatData);

    function formatData(err, results) {
        if (err) {
            console.log(err);
            return res.json(results);
        }
        var list = [];

        if(results['ERASA']) list = [...results['ERASA']];
        if(results['DRASA']) list = [...list, ...results['DRASA']];
        if(results['NAMEF']) list = [...list, ...results['NAMEF']];
        if(results['PRIVATE']) list = [...list, ...results['PRIVATE']];

        list = list.sort(function (a, b) {
            if(a.type == 'PERSONAL') {
                a.start = a.date;
            }
            if(b.type == 'PERSONAL') b.start = b.date;

            let aStart = moment(a.start);
            let bStart = moment(b.start);

            if (aStart > bStart) return -1;
            else if (bStart > aStart) return 1;
            else return 0;
        });

        list = list.slice(start, end);
        let counter = start;
        list = list.map(function(item) {
            item.newId = counter++;
            return item;
        });

        return res.json(list);

    }
}

function AddEvent(req, res) {
    var db = getDb();
    var event = {
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