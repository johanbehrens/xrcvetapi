var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
const async = require('async');
const sites = require('../helpers/sites');
var { enqueueJob } = require('../helpers/jobqueue');

require('../config/passport')(passport);

router.get('/:type/:id', GetResults);
router.get('/:type/:id/live', GetLiveResults);
router.post('/:type/search', SearchResults);
router.post('/:type/:id', AddLiveResults);
router.post('/:type/:id/generateCerts', GenerateCertificates);
router.post('/:type/:id/:dayno', UpdateLiveResults);
router.post('/status', GetLocalServerStatus);

function UpdateLiveResults(req, res) {
    console.log('UpdateLiveResults');

    let type = req.params.type;
    let raceId = req.params.id;
    let riderNumber = req.params.dayno;

    db.collection('location').updateOne(
        { type, raceId, riderNumber },
        {
            $set: {
                ...item
            }
        },
        { upsert: true }, function (err, result) {
            res.send(result);
        });
}

function AddLiveResults(req, res) {
    var db = getDb();
    let date = new Date(new Date(req.body.stamp).toISOString().split('T')[0]);
    let clientTime = new Date(req.body.stamp);
    let serverTime = new Date();
    var clientServerDiff = (serverTime - clientTime);

    let type = req.params.type;

    let dayNrChanges = req.body.dayNrChanges;
    if (dayNrChanges && dayNrChanges.length > 0) {
        async.eachSeries(dayNrChanges, function (dayNrChange, callback) {
            db.collection('location').updateOne(
                { type, raceId: req.body.raceid, date, riderNumber: dayNrChange.previous },
                {
                    $set: {
                        riderNumber: dayNrChange.new
                    }
                }, function (err, result) {
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
                updateAll();
            }
        });
    }
    else 
    {
        updateAll();
    }

    function updateAll() {
        console.log('AddLiveResults');
        let items = req.body.items;
        items.map(i => {
            if (i.AVE_SPD == 0) i.AVE_SPD = 'n/a';
            if (i.AVE_SPD == 0) i.AVE_SPD = 'n/a';
            if (!i["HCODE"]) i["HCODE"] = 'n/a';
            if (!i["TOT_TIME"] || i["TOT_TIME"] == '') i["TOT_TIME"] = '00:00:00';
            if (!i["TOTSLIP"] || i["TOTSLIP"] == '') i["TOTSLIP"] = '00:00:00';
            i.raceId = req.body.raceid;
            i.type = type;
            i.date = date;
            i.diff = clientServerDiff;
        });

        async.eachSeries(items, function (item, callback) {
            let newItem = {};
            Object.keys(item).forEach(i => {
                let index = i.replace(/\uFFFD/g, '').replace(/\u0001/g, '').replace(/\u0002/g, '').replace(/\u0003/g, '').replace(/\u0004/g, '').replace(/\u0005/g, '').replace(/\)/g, '');
                newItem[index] = item[i];
            })
            db.collection('location').updateOne(
                { type, raceId: req.body.raceid, date, riderNumber: newItem.DAYNO },
                {
                    $set: {
                        ...newItem,
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

function GenerateCertificates(req, res) {
    console.log('GenerateCertificates');
    let type = req.params.type;

    if (type != 'ERASA') {
        res.status(500);
        return res.json({
            message: 'Only ERASA Implemented',
            error: 'Only ERASA Implemented'
        });
    }

    enqueueJob({
        jobName: 'workflow',
        data: {
            workflowId: '60365962be4f6b5648bd6195',
            params: {
                raceid: req.params.id
            }
        },
    }, function (err, arg) {
        if (err) {
            console.log(err);
            res.status(500);
            return res.json({
                message: err.message,
                error: err
            });
        }
        else return res.send({ message: 'enqeued' });
    })
}

function GetResults(req, res) {
    console.log('GetResults');


    sites.getResults(req.params.type, req.params.id, done);

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

function liveLocationsAggregate(raceId, type) {
    return [{
        $match: {
            raceId,
            type
        }
    }, {
        $project: {
            rider: 1,
            locations: { $slice: ["$locations", -3] },
            raceId: 1,
            riderNumber: 1,
            date: 1,
            type: 1,
            diff: 1,
            AVE_SPD: 1,
            ARRIVAL1: 1,
            ARRIVAL2: 1,
            ARRIVAL3: 1,
            ARRIVAL4: 1,
            ARRIVAL5: 1,
            ARRIVAL6: 1,
            CALLNAME: 1,
            CCODE: 1,
            CAT: 1,
            DAYNO: 1,
            DLEG1: 1,
            DLEG2: 1,
            DLEG3: 1,
            DLEG4: 1,
            DLEG5: 1,
            DLEG6: 1,
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
            COL_LEG1: 1,
            COL_LEG2: 1,
            COL_LEG3: 1,
            COL_LEG4: 1,
            COL_LEG5: 1,
            COL_LEG6: 1,
            SPEED1: 1,
            SPEED2: 1,
            SPEED3: 1,
            SPEED4: 1,
            SPEED5: 1,
            SPEED6: 1,
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
    }, {
        $sort: {
            date: 1, CAT: 1, TOT_TIME: -1
        }
    }];
}

function GetLiveResults(req, res) {

    var db = getDb();

    console.log('GetResults');
    db.collection('location').aggregate(liveLocationsAggregate(req.params.id, req.params.type)).toArray(function (err, results) {

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
            CALLNAME: item.CALLNAME,
            FNAME: item.FNAME,
            HCODE: item.HCODE,
            HNAME: item.HNAME,
            TotTime: item.TOT_TIME,
            TOT_TIME: item.TOT_TIME,
            "C/Speed": parseInt(item.AVE_SPD),
            Time1: item.R_TIME1,
            Pulse1: item.PULSE1,
            Time2: item.R_TIME2,
            Pulse2: item.PULSE2,
            Time3: item.R_TIME3,
            Pulse3: item.PULSE3,
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