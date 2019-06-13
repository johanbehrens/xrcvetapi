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
                { type, raceId: req.body.raceid, date, riderNumber:item.DAYNO },
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
        },function(err){
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
    db.collection('location').find({ type: req.params.type, raceId: req.params.id },resultsProjection).sort({ date: 1, Category: 1 }).toArray(function (err, results) {
        console.log('return GetResults');
        if (err) {
            res.status(500);z
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            res.send(results);
        }
    });
}

const resultsProjection = {
    location: 0
}

module.exports = router;