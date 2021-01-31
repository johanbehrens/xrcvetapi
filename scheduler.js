"use strict";
var schedule = require('node-schedule');
const queue = require("./helpers/jobqueue");
var ObjectId = require('mongodb').ObjectID;
const getDb = require("./db").getDb;
const initDb = require("./db").initDb;
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors')

var app = express();
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

initDb({}, function () {
    var db = getDb();
    db.collection('schedules').find({ active: true }, function (err, schedules) {
        if (err) {
            console.log(err);
            throw err;
        }

        schedules.forEach(s => {
            console.log('Adding schedule ' + s.scheduleName);
            schedule.scheduleJob("" + s._id, s.scheduleString, function () {
                console.log('Enqueue workflow: ' + s.scheduleName);
                queue.enqueueJob(
                    {
                        jobName: s.scheduleType,
                        data: {
                            workflowId: s.workflowId
                        }
                    },
                    done);
            });
        });

        app.listen(4011, function (err) {
            if (err) {
                throw err;
            }
            console.log("Schedule API Up and running on port " + 4011);
        });
    });
});

app.get('/', function (req, res) {
    var db = getDb();
    db.collection('schedules').find({}).toArray(function (err, schedules) {
        if (err) {
            console.log(err);
            return res.send(err);
        }

        schedules.forEach(s => {
            let job = schedule.scheduledJobs[s._id];
            if (job) {
                s.nextRun = job.nextInvocation().toString();
            }
        });
        res.send(schedules);
    });
});

app.post('/:scheduleid', function (req, res) {
    var db = getDb();

    if (!req.body._id) {
        db.collection('schedules').insertOne(req.body, function (err, result) {
            if (err) {
                console.log(err);
                return res.send({ 'error: ': err.message });
            }
            addToScheduler(result.insertedId.toString());
        });
    }
    else {
        delete req.body._id;
        db.collection('schedules').replaceOne({ _id: ObjectId(req.params.scheduleid) }, req.body, function (err) {
            if (err) {
                console.log(err);
                return res.send({ 'error: ': err.message });
            }
            addToScheduler(req.params.scheduleid);
        })
    }

    function addToScheduler(id) {
        let job = schedule.scheduledJobs[id];

        if (!!req.body.active) {
            if (job) console.log('Enqueue workflow: ' + job.nextInvocation().toString());
            else {
                schedule.scheduleJob("" + id, req.body.scheduleString, function () {
                    queue.enqueueJob(
                        {
                            jobName: req.body.scheduleType,
                            data: {
                                workflowId: req.body.workflowId
                            }
                        },
                        done);
                });
            };
            console.log('Schedule Enqueued: ' + req.body.scheduleName);
            res.send({ "message": "success" });
        }
        else if (job) {
            job.cancel();
            console.log('Schedule Cancelled: ' + req.body.scheduleName);
            res.send({ "message": "success" });
        }
        else {
            res.send({ "message": "Done" });
        }
    }
});

function done(args) {
    console.log('Job Done');
}