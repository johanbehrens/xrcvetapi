var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
var { GetUserIds } = require('../helpers/user');
const async = require('async');

router.post('/', AddHorse);
router.get('/', GetHorses);
router.get('/:id/summary', GetHorseSummary);
router.get('/:id', GetHorse);
const sites = require('../helpers/sites');

function GetHorseSummary(req, res) {
    console.log('GetHorseSummary');
    var db = getDb();

    return db.collection('horse').findOne({ _id: ObjectID(req.params.id) }, function (err, horse) {
        if (err) {
            res.status(500);
            return res.json({
                message: err.message,
                error: err
            });
        }
        else {
            if (horse) {
                let functionList = {}

                if (horse.erasa) functionList['ERASA'] = async.apply(sites.getHorseSummary, 'ERASA', horse.erasa);
                if (horse.drasa) functionList['DRASA'] = async.apply(sites.getHorseSummary, 'DRASA', horse.drasa);
                if (horse.namef) functionList['NAMEF'] = async.apply(sites.getHorseSummary, 'NAMEF', horse.namef);

                return async.parallel(functionList, formatData);

                function formatData(err, results) {
                    if (err) {
                        console.log(err);
                        return res.json(results);
                    }
                    else {
                        let ret = []
                        Object.keys(results).forEach((key) => {

                            let i ={};

                            results[key].map((item,index) => {
                                i[item.title]= item.value;
                            });

                            ret.push({
                                items: i,
                                key
                            })
                        });

                        res.send(ret);
                    }
                };
            }

        }
    });
}

function GetHorse(req, res) {
    console.log('GetHorse');
    var db = getDb();

    db.collection('horse').findOne({ _id: parseInt(req.params.id) }, function (err, horse) {
        if (err) {
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

    db.collection('horse').findOne({ _id: req.body._id }, function (err, horse) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            if (!horse) {
                db.collection('horse').insertOne(req.body, function (err, horse) {
                    let h = horse.ops[0];
                    h.own = true;
                    h.own = h.userId.toString() == req.user._id.toString();
                    h.edit = h.own && (req.user.valid || h.default);

                    res.send(h);
                })
            }
            else {
                db.collection('horse').replaceOne({ _id: req.body._id }, req.body, function (err, horse) {
                    let h = horse.ops[0];
                    h.own = true;
                    h.own = h.userId.toString() == req.user._id.toString();
                    h.edit = h.own && (req.user.valid || h.default);

                    res.send(h);
                })
            }
        }

    });
}

module.exports = router;