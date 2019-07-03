var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
const async = require('async');

require('../config/passport')(passport);

router.get('/:type/:id', GetResults);
router.post('/:type/:id', AddLiveResults);

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
        i.raceId = req.body.raceid;
        i.type = type;
        i.date = date;
        i.diff = clientServerDiff;
    });

    /* if (req.body.function == 'insert') {
         db.collection('liveresults').deleteMany({ type, raceId: req.body.raceid, date }, function (err) {
             db.collection('liveresults').insertMany(items, function (err, doc) {
                 if (err) {
                     res.status(500);
                     res.json({
                         message: err.message,
                         error: err
                     });
                 }
                 else {
                     let reply = {
                         insert: 'success'
                     };
                     res.send(reply);
                 }
             });
         });
     }
     else {*/
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
    // }

}

function GetResults(req, res) {
    var db = getDb();

    console.log('GetResults');
    db.collection('location').find({ type: req.params.type, raceId: req.params.id }, resultsProjection).sort({ date: 1, Category: 1, Pos: 1 }).toArray(function (err, results) {
        console.log('return GetResults');
        if (err) {
            res.status(500); z
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            let trans = transformResults(results, req.params.id);
            res.send(trans);
        }
    });
}

function transformResults(results, raceId) {
    var db = getDb();

    db.collection('event').findOne({ raceId }, function (err, event) {
        if (err) {
            return {
                message: err.message,
                error: err
            };
        }
        else {
            if (event.isFS == 1) {
                if (event.Day == 1) {
                    return results.map(item => {
                        return {
                            Code: item.NO,
                            TotTime: item.D1TOTTIM,
                            Ride: event.title,
                            Pos: item.Pos,
                            Category: item.CAT,
                            "C/Speed": item.D1_SPD4,
                            Rider: item.CALLNAME + ' ' + item.FNAME,
                            Horse: item.HNAME,
                            HCode: item.HCODE,
                            Time1: item.D1RTIME1,
                            Pulse1: item.D1_PUL1,
                            Time2: item.D1RTIME2,
                            Pulse2: item.D1_PUL2,
                            Time3: item.D1RTIME3,
                            Pulse3: item.D1_PUL3,
                        }
                    });
                }
                else if (event.Day == 2) {
                    return results.map(item => {
                        return {
                            Code: item.NO,
                            TotTime: item.D2TOTTIM,
                            Ride: event.title,
                            Pos: item.Pos,
                            Category: item.CAT,
                            "C/Speed": item.D2_SPD4,
                            Rider: item.CALLNAME + ' ' + item.FNAME,
                            Horse: item.HNAME,
                            HCode: item.HCODE,
                            Time1: item.D2RTIME1,
                            Pulse1: item.D2_PUL1,
                            Time2: item.D2RTIME2,
                            Pulse2: item.D2_PUL2,
                            Time3: item.D2RTIME3,
                            Pulse3: item.D2_PUL3,
                        }
                    });
                }
                else if (event.Day == 3) {
                    return results.map(item => {
                        return {
                            Code: item.NO,
                            TotTime: item.D3TOTTIM,
                            Ride: event.title,
                            Pos: item.Pos,
                            Category: item.CAT,
                            "C/Speed": item.D3_SPD4,
                            Rider: item.CALLNAME + ' ' + item.FNAME,
                            Horse: item.HNAME,
                            HCode: item.HCODE,
                            Time1: item.D3RTIME1,
                            Pulse1: item.D3_PUL1,
                            Time2: item.D3RTIME2,
                            Pulse2: item.D3_PUL2,
                            Time3: item.D3RTIME3,
                            Pulse3: item.D3_PUL3,
                        }
                    });
                }
            }
            else {
                return results;
            }
        }
    });
}

const resultsProjection = {
    location: 0
}

module.exports = router;