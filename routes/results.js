var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
const async = require('async');

require('../config/passport')(passport);

router.get('/:type/:id', GetResults);
router.post('/:type/search', SearchResults);
router.post('/:type/:id', AddLiveResults);
router.post('/status', GetLocalServerStatus);

function AddLiveResults(req, res) {
    var db = getDb();
    let date = new Date(new Date(req.body.stamp).toISOString().split('T')[0]);
    let clientTime = new Date(req.body.stamp);
    let serverTime = new Date();
    var clientServerDiff = (serverTime - clientTime);

    let type = req.params.type;

    console.log('AddLiveResults');
    let items = JSON.parse(req.body.items);
    items.map(i => {
        if(i.AVE_SPD == 0) i.AVE_SPD = 'n/a';
        if(i.AVE_SPD == 0) i.AVE_SPD = 'n/a';
        if (!i["HCODE"]) i["HCODE"] = 'n/a';
        if (!i["TOT_TIME"] || i["TOT_TIME"] == '') i["TOT_TIME"] = '00:00:00';
        if (!i["TOTSLIP"] || i["TOTSLIP"] == '') i["TOTSLIP"] = '00:00:00';
        i.raceId = req.body.raceid;
        i.type = type;
        i.date = date;
        i.diff = clientServerDiff;
    });

    async.eachSeries(items, function (item, callback) {
        db.collection('location').updateOne(
            { type, raceId: req.body.raceid, date, riderNumber: item.DAYNO },
            {
                $set: {
                    ...item,
                    type,
                    raceid: req.body.raceid,
                    date
                }
            },
            { upsert: true }, function (err, result) {
                callback();
            });
    }, function (err) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            let reply = {
                update: 'success'
            };
            res.send(reply);
        }
    });
}

function GetLocalServerStatus(req, res) {
    var db = getDb();
    let toUpdate = {
        ip: req.body.ip,
        heartbeat: new Date()
    };
    if (req.body.status) {
        toUpdate.status = req.body.status;
    }
    if (req.body.error) {
        toUpdate.error = req.body.error;
    }
    if (req.body.files) {
        toUpdate.files = req.body.files;
    }
    if (req.body.username) {
        toUpdate.username = req.body.username;
    }
    if (req.body.file) {
        toUpdate.file = req.body.file;
    }
    if (req.body.password) {
        toUpdate.password = req.body.password;
    }
    if (!req.body.timer) {
        toUpdate.timer = 10000;
    }
    if (!req.body.export) {
        toUpdate.export = false;
    }
    if (!req.body.type) {
        toUpdate.type = 'ERASA';
    }

    db.collection('localServers').updateOne(
        { mac: req.body.mac },
        {
            $set: toUpdate
        },
        { upsert: true }, function (err, result) {
            db.collection('localServers').findOne({ mac: req.body.mac }, function (err, server) {
                res.send(server);
            });
        });
}

function GetResults(req, res) {
    var db = getDb();

    console.log('GetResults');
    db.collection('location').find({ type: req.params.type, raceId: req.params.id }).project(resultsProjection).sort({ date: 1, Category: 1, Division: 1, Pos: 1 }).toArray(function (err, results) {
        console.log('return GetResults');
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            if (req.params.type == 'DRASA') {
                return res.send(drasaResults(results));
            }
            else {
                transformResults(results, req.params.id, done);
            }
            function done(err, trans) {
                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else res.send(trans);
            }
        }
    });
}

function drasaResults(results, raceId, callback) {
    return results.map(item => {

        let toReturn = {
            Code: item.riderNumber,
            DIST: item.Distance,
            CAT: item.Division,
            Ride: item.Ride,
            Pos: item.Position,
            Category: item.Division,
            Rider: item.Rider,
            Horse: item.Horse,
            HCode: item["Passport No"],
            CALLNAME: " ",
            FNAME: " ",
            HCODE: " ",
            HNAME: " ",
            TotTime: " ",
            TOT_TIME: " ",
            "C/Speed": parseInt(item["Actual Speed"]),
            Time1: " ",
            Pulse1: " ",
            Time2: " ",
            Pulse2: " ",
            Time3: " ",
            Pulse3: " ",
            Club: item.Club,
            Points: item["ACTUAL POINTS"]
            
        }
        if (item.DISQ != '') toReturn.DISQ = item.DISQ;

        return toReturn;
    });
}

function transformResults(results, raceId, callback) {
    var db = getDb();

    db.collection('event').findOne({ id: raceId }, function (err, event) {
        if (err) {
            return callback({
                message: err.message,
                error: err
            });
        }
        else if (!event) {
            return callback({
                message: 'No event found',
                error: 'No event found'
            });
        }
        else {
            if (event.isFS == 1) {
                return callback(null, results.map(item => {
                    let toReturn = {
                        Code: item.NO + "-",
                        DIST: '' + "-",
                        CAT: item.CAT + "-",
                        Ride: event.title + "-",
                        Pos: item.POS + "-",
                        Category: item.CAT + "-",
                        Rider: item.CALLNAME + ' ' + item.FNAME + "-",
                        Horse: item.HNAME + "-",
                        HCode: item.HCODE + "-",
                        CALLNAME: item.CALLNAME + "-",
                        FNAME: item.FNAME + "-",
                        HCODE: item.HCODE + "-",
                        HNAME: item.HNAME + "-",

                    }
                    if (item.DISQ != '') toReturn.DISQ = item.DISQ;

                    if (event.Day == 1) {
                        return {
                            ...toReturn,
                            TotTime: item.D1TOTTIM + '-',
                            TOT_TIME: item.D1TOTTIM + '-',
                            "C/Speed": item.D1_SPD4 + "-",
                            Time1: item.D1RTIME1 + "-",
                            Pulse1: item.D1_PUL1 + "-",
                            Time2: item.D1RTIME2 + "-",
                            Pulse2: item.D1_PUL2 + "-",
                            Time3: item.D1RTIME3 + "-",
                            Pulse3: item.D1_PUL3 + "-"
                        }
                    }
                    else if (event.Day == 2) {
                        return {
                            ...toReturn,
                            TotTime: item.D2TOTTIM + '-',
                            TOT_TIME: item.D2TOTTIM + '-',
                            "C/Speed": item.D2_SPD4,
                            Time1: item.D2RTIME1,
                            Pulse1: item.D2_PUL1,
                            Time2: item.D2RTIME2,
                            Pulse2: item.D2_PUL2,
                            Time3: item.D2RTIME3,
                            Pulse3: item.D2_PUL3,
                        }
                    }
                    else if (event.Day == 3) {
                        return {
                            ...toReturn,
                            TotTime: item.D3TOTTIM + '-',
                            TOT_TIME: item.D3TOTTIM + '-',
                            "C/Speed": item.D3_SPD4,
                            Time1: item.D3RTIME1,
                            Pulse1: item.D3_PUL1,
                            Time2: item.D3RTIME2,
                            Pulse2: item.D3_PUL2,
                            Time3: item.D3RTIME3,
                            Pulse3: item.D3_PUL3,
                        }
                    }
                }).sort((a, b) => a.Pos - b.Pos));
            }
            else {
                return callback(null, results);
            }
        }
    });
}

function SearchResults(req, res) {
    var db = getDb();

    let keys = Object.keys(req.body);
    let match = {
        type: req.params.type
    };
    keys.forEach(key => {
        match[key] = { $regex: req.body[key], $options: 'i' }
    });
    console.log(match);
    db.collection('location').find(match, resultsProjection)
        .sort({ date: 1, Category: 1, Pos: 1 })
        .toArray(function (err, results) {
            res.send(results);
        });
}

const resultsProjection = {
    locations: 0
}

module.exports = router;