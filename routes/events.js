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

    let functionList = {
        ERASA: async.apply(sites.getEvents, 'ERASA'),
        DRASA: async.apply(sites.getEvents, 'DRASA'),
        NAMEF: async.apply(sites.getEvents, 'NAMEF'),
        PARKRIDES: async.apply(sites.getEvents, 'PARKRIDES'),
        PRIVATE: async.apply(user.GetHistory, req.user._id)
    };

    req.query.page = parseInt(req.query.page) + 1;
    if(req.query.filter){
        functionList = {};

        let newfilter = req.query.filter.split(',');
        newfilter.forEach(fil => {
            let t = fil.split(':');
            if(t[0] == 'ERASA' && t[1] == 'true') functionList['ERASA'] = async.apply(sites.getEvents, 'ERASA');
            if(t[0] == 'DRASA' && t[1] == 'true') functionList['DRASA'] = async.apply(sites.getEvents, 'DRASA');
            if(t[0] == 'NAMEF' && t[1] == 'true') functionList['NAMEF'] = async.apply(sites.getEvents, 'NAMEF');
            if(t[0] == 'PARKRIDES' && t[1] == 'true') functionList['PARKRIDES'] = async.apply(sites.getEvents, 'PARKRIDES');

            if(t[0] == 'PERSONAL' && t[1] == 'true') functionList['PRIVATE'] = async.apply(user.GetHistory, req.user._id)
        });
    }

    let start = 0;
    let end = req.query.page * 20;
    if (end > 0) {
        start = end - 20;
    }
    else {
        end = 20;
    }
    console.log('GetEvents', start, end);

    

    async.parallel(functionList, formatData);

    function formatData(err, results) {
        if (err) {
            console.log(err);
            return res.json(results);
        }
        var list = [];

        if (results['ERASA']) list = [...results['ERASA']];
        if (results['DRASA']) list = [...list, ...results['DRASA']];
        if (results['PARKRIDES']) list = [...list, ...results['PARKRIDES']];
        if (results['NAMEF']) list = [...list, ...results['NAMEF']];
        if (results['PRIVATE']) list = [...list, ...results['PRIVATE']];

        list = list.sort(function (a, b) {
            if (a.type == 'PERSONAL') {
                a.end = a.date;
            }
            if (b.type == 'PERSONAL') b.end = b.date;

            let aStart = moment(a.end);
            let bStart = moment(b.end);

            if (aStart > bStart) return -1;
            else if (bStart > aStart) return 1;
            else return 0;
        });

        list = list.slice(start, end);
        let counter = start;
        list = list.map(function (item) {
            item.newId = counter++;
            return item;
        });

        let rest = [];
        let live = [];
        let upcoming = [];
        let active = [];

        list.forEach(event => {
            if (event) {
                let deventDate = new Date(event.start);
                let eventDate = deventDate.toISOString().split('T')[0];

                let dendDate = new Date(event.end);
                let endDate = dendDate.toISOString().split('T')[0];

                let dtoday = new Date();
                let today = dtoday.toISOString().split('T')[0];

                if (eventDate != endDate && deventDate <= dtoday && dtoday <= dendDate) {
                    event._active = true;
                    event._text = 'ACTIVE';
                    active.push(event);
                }
                else if (eventDate == today) {
                    event._live = true;
                    event._text = 'LIVE';
                    live.push(event);
                }
                else if (new Date(event.start) < new Date()) {
                    event._result = true;
                    event._text = 'LIVE';
                    rest.push(event);
                    if (event.hasResults == '1') event._text = 'RESULTS';
                    else event._text = 'RESULTS PENDING';
                }
                else {
                    event._upcoming = true;
                    upcoming.push(event);
                    if (event.isClosed == '0') event._text = 'ENTER NOW';
                    else event._text = 'ENTRIES CLOSED';
                }
            }
        });

        list = [...live, ...active, ...upcoming, ...rest];

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