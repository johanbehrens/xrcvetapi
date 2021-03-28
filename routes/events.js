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
const ObjectId = require("mongodb").ObjectId;

router.post('/', passport.authenticate('jwt', { session: false }), AddEvent);
router.post('/:id/', passport.authenticate('jwt', { session: false }), AddEventItem);

router.post('/:type/:id/track/', passport.authenticate('jwt', { session: false }), AddEventLeg);
router.delete('/:type/:id/track/:trackid', passport.authenticate('jwt', { session: false }), RemoveEventLeg);

router.post('/:type/:id/official/', passport.authenticate('jwt', { session: false }), AddEventOfficial);
router.delete('/:type/:id/official/:officialid', passport.authenticate('jwt', { session: false }), RemoveEventOfficial);

router.get('/', passport.authenticate('jwt', { session: false }), GetEvents);
router.get('/:type/:id', GetEvent);
router.get('/:type/liveUpdates/:id', getLocations);
router.get('/:type/tracks/:id', getTracks);
router.get('/:type/officials/:id', getOfficials);
router.get('/:type/officialCard/:id', getOfficialCard);
router.get('/:type/entries/:id', GetEventEntries);
router.get('/import', passport.authenticate('jwt', { session: false }), ImportEvents);
router.get('/public', GetPublicEvents);

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

function getLocations(req, res) {
    var db = getDb();

    console.log('getLocations');
    db.collection('location').aggregate(userLocationsAggregate(req.params.id, req.params.type)).toArray(function (err, locations) {
        console.log('return getLocations');
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            res.send(locations);
        }
    });
}

function getOfficials(req, res) {
    var db = getDb();

    db.collection('event').aggregate([{ $match: { id: req.params.id, type: req.params.type } }, {
        $lookup: {
            "from": "users",
            "localField": "officials",
            "foreignField": "_id",
            "as": "officials"
        }
    }]).toArray(function (err, doc) {

        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else if (doc.length == 1) {
            doc = doc[0];
            if (doc.officials && doc.officials.length > 0) {
                return res.send(doc.officials);
            }

            return res.send([]);
        }
        else return res.send([]);
    });
}

function getTracks(req, res) {
    var db = getDb();

    db.collection('event').aggregate([{ $match: { id: req.params.id, type: req.params.type } }, {
        $lookup: {
            "from": "track",
            "localField": "legs.trackId",
            "foreignField": "_id",
            "as": "tracks"
        }
    }]).toArray(function (err, doc) {

        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else if (doc.length == 1) {
            doc = doc[0];
            if (doc.tracks && doc.tracks.length > 0) {
                doc.tracks = doc.tracks.map(track => {
                    return {
                        ...track,
                        leg: doc.legs.find(leg => leg.trackId.toString() == track._id.toString()).leg,
                        color: doc.legs.find(leg => leg.trackId.toString() == track._id.toString()).color
                    }
                });
                return res.send(doc.tracks);
            }

            return res.send([]);
        }
        else return res.send([]);
    });
}

function GetEvent(req, res) {
    var db = getDb();

    return sites.getEvent(req.params.type, req.params.id, addExtra);

    function addExtra(err, e) {
        db.collection('event').aggregate([{ $match: { id: req.params.id, type: req.params.type } }, {
            $lookup: {
                "from": "users",
                "localField": "officials",
                "foreignField": "_id",
                "as": "officials"
            }
        },
        {
            $lookup: {
                "from": "track",
                "localField": "legs.trackId",
                "foreignField": "_id",
                "as": "tracks"
            }
        }]).toArray(function (err, doc) {

            if (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            }
            else if (doc.length == 1) {
                doc = doc[0];
                if (doc.tracks && doc.tracks.length > 0) {
                    doc.tracks = doc.tracks.map(track => {
                        return {
                            ...track,
                            leg: doc.legs.find(leg => leg.trackId.toString() == track._id.toString()).leg,
                            color: doc.legs.find(leg => leg.trackId.toString() == track._id.toString()).color
                        }
                    })
                }

                res.send({
                    ...e,
                    ...doc
                });
            }
            else res.send(e);
        });
    }
}

function RemoveEventLeg(req, res) {
    var db = getDb();

    db.collection('event').findOne({ id: req.params.id, type: req.params.type }, function (err, event) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        if (!event) {
            return res.send({});
        }
        else {
            event.legs = event.legs.filter(i => i.trackId.toString() !== req.params.trackid);

            db.collection('event').replaceOne(
                { id: req.params.id, type: req.params.type }, event, function (err, l) {
                    return res.send(event);
                });
        }
    });
}

function RemoveEventOfficial(req, res) {
    var db = getDb();

    db.collection('event').findOne({ id: req.params.id, type: req.params.type }, function (err, event) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        if (!event) {
            return res.send({});
        }
        else {
            event.officials = event.officials.filter(i => i.toString() !== req.params.officialid);

            db.collection('event').replaceOne(
                { id: req.params.id }, event, function (err, l) {
                    return res.send({});
                });
        }
    });
}

function AddEventLeg(req, res) {
    var db = getDb();
    let newTrack = req.body.track;
    newTrack.trackId = ObjectId(newTrack.trackId);

    db.collection('event').findOne({ id: req.params.id, type: req.params.type }, function (err, event) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        if (!event) {

            event = {
                id: req.params.id,
                type: req.params.type,
                legs: [newTrack]
            }

            db.collection('event').insertOne(event, function (err, doc) {
                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else res.send(event);
            });
        }
        else {
            if (!event.legs) event.legs = [];
            else {
                event.legs = event.legs.filter(i => i.trackId.toString() !== newTrack.trackId.toString());
                event.legs.push(newTrack);
            }

            db.collection('event').replaceOne(
                { id: req.params.id, type: req.params.type }, event, function (err, l) {
                    return res.send(event);
                });
        }
    });
}

function AddEventOfficial(req, res) {
    var db = getDb();
    let userId = req.body.userId;
    userId = ObjectId(userId);

    db.collection('event').findOne({ id: req.params.id, type: req.params.type }, function (err, event) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        if (!event) {
            event = {
                id: req.params.id,
                type: req.params.type,
                officials: [userId]
            }

            db.collection('event').insertOne(event, function (err, doc) {
                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else res.send(event);
            });
        }
        else {
            if (!event.officials) event.officials = [];
            else {
                event.officials = event.officials.filter(i => i.toString() !== userId);
                event.officials.push(userId);
            }

            db.collection('event').replaceOne(
                { id: req.params.id, type: req.params.type }, event, function (err, l) {
                    return res.send(event);
                });
        }
    });
}

function GetLocalEvents(callback) {
    var db = getDb();

    db.collection('event').find({}).toArray(function (err, events) {
        return callback(err, events);
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

function getOfficialCard(req, res) {
    console.log('getOfficials');

    sites.getOfficials(req.params.type, req.params.id, done);

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

function GetPublicEvents(req, res) {

    let functionList = {
        ERASA: async.apply(sites.getEvents, 'ERASA'),
        DRASA: async.apply(sites.getEvents, 'DRASA'),
        NAMEF: async.apply(sites.getEvents, 'NAMEF'),
        PARKRIDES: async.apply(sites.getEvents, 'PARKRIDES'),
        LOCAL: GetLocalEvents
    };

    req.query.page = parseInt(req.query.page) + 1;

    let start = 0;
    let end = req.query.page * 20;
    if (end > 0) {
        start = end - 20;
    }
    else {
        end = 20;
    }
    console.log('GetPublicEvents', start, end);

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

        list = list.sort(function (a, b) {
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

                let l = results.LOCAL.find(ev => ev.id == event.id && ev.type == event.type);
                if (l) event.legs = l.legs;
            }
        });

        list = [...live, ...active, ...upcoming, ...rest];

        return res.json(list);

    }
}

function GetEvents(req, res) {

    let functionList = {
        ERASA: async.apply(sites.getEvents, 'ERASA'),
        DRASA: async.apply(sites.getEvents, 'DRASA'),
        NAMEF: async.apply(sites.getEvents, 'NAMEF'),
        PARKRIDES: async.apply(sites.getEvents, 'PARKRIDES'),
        PRIVATE: async.apply(user.GetHistory, req.user._id),
        LOCAL: GetLocalEvents
    };

    req.query.page = parseInt(req.query.page) + 1;
    if (req.query.filter) {
        functionList = {};

        let newfilter = req.query.filter.split(',');
        newfilter.forEach(fil => {
            let t = fil.split(':');
            if (t[0] == 'ERASA' && t[1] == 'true') functionList['ERASA'] = async.apply(sites.getEvents, 'ERASA');
            if (t[0] == 'DRASA' && t[1] == 'true') functionList['DRASA'] = async.apply(sites.getEvents, 'DRASA');
            if (t[0] == 'NAMEF' && t[1] == 'true') functionList['NAMEF'] = async.apply(sites.getEvents, 'NAMEF');
            if (t[0] == 'PARKRIDES' && t[1] == 'true') functionList['PARKRIDES'] = async.apply(sites.getEvents, 'PARKRIDES');
            if (t[0] == 'PERSONAL' && t[1] == 'true') functionList['PRIVATE'] = async.apply(user.GetHistory, req.user._id);
            functionList['LOCAL'] = GetLocalEvents
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
                let deventDate = new Date();
                let dendDate = new Date();

                if (event.type == 'PERSONAL') {
                    deventDate = event.date;
                    dendDate = event.date;
                }
                else {
                    dendDate = new Date(event.end);
                    deventDate = new Date(event.start);
                }

                let eventDate = deventDate.toISOString().split('T')[0];

                let dtoday = new Date();
                let today = dtoday.toISOString().split('T')[0];

                if (event.type != 'PERSONAL' && eventDate != dendDate.toISOString().split('T')[0] && deventDate <= dtoday && dtoday <= dendDate.toISOString().split('T')[0]) {
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

                let l = results.LOCAL.find(ev => ev.id == event.id && ev.type == event.type);
                if (l) event.legs = l.legs;
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

function userLocationsAggregate(raceId, type) {
    return [{
        $match: {
            raceId,
            type
        }
    }, {
        $lookup: {
            "from": "rider",
            "localField": "riderId",
            "foreignField": "_id",
            "as": "rider"
        }
    }, {
        $project: {
            rider: 1,
            locations: { $slice: ["$locations", -3] },
            raceId: 1,
            riderNumber: 1,
            type: 1,
            AVE_SPD: 1,
            CALLNAME: 1,
            CAT: 1,
            DAYNO: 1,
            DISQ: 1,
            DIST: 1,
            FNAME: 1,
            HCODE: 1,
            HNAME: 1,
            MCODE: 1,
            PULSE1: 1,
            PULSE2: 1,
            PULSE3: 1,
            PULSE4: 1,
            PULSE5: 1,
            PULSE6: 1,
            REASON: 1,
            R_TIME1: 1,
            R_TIME2: 1,
            R_TIME3: 1,
            R_TIME4: 1,
            R_TIME5: 1,
            R_TIME6: 1,
            SLIP1: 1,
            SLIP2: 1,
            SLIP3: 1,
            SLIP4: 1,
            SLIP5: 1,
            SLIP6: 1,
            TIME1: 1,
            TIME10: 1,
            TIME11: 1,
            TIME12: 1,
            TIME2: 1,
            TIME3: 1,
            TIME4: 1,
            TIME5: 1,
            TIME6: 1,
            TIME7: 1,
            TIME8: 1,
            TIME9: 1,
            TOTSLIP: 1,
            TOT_TIME: 1,
        }
    }];
}



module.exports = router;