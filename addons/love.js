var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var fetch = require('node-fetch');
var { enqueue } = require('../helpers/jobqueue');

router.get('/UpdateLoveMeter/:email/:tank', UpdateLoveMeter);
router.get('/AddLoveMeter/:email/:partner_email/:tank/:lang1/:lang2', AddLoveMeter);

function AddLoveMeter(req, res) {
    var db = getDb();

    db.collection('love').insertOne(req.params, function (err) {
        const notification = {
            to: req.params.email,
            subject: 'Love life added',
            html: `<html>Welcome to your new love life<br>
            How much do you feel loved by your partner currently 1-10
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/1">1</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/2">2</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/3">3</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/4">4</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/5">5</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/6">6</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/7">7</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/8">8</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/9">9</a>
            <a href="http://localhost:8080/love/UpdateLoveMeter/behrens.johan@gmail.com/10">10</a>
            </html>`,
            scheduledDate: new Date()
        };

        enqueue.sendEmail(notification, done);

        function done(err) {
            console.log(err);
            res.send("Added");
        }
    })
}

function UpdateLoveMeter(req, res) {
    var db = getDb();

    db.collection('love').findOne({ email: req.params.email }, function (err, person) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            if (!person) {
                res.send("Not found");

            }
            else {
                person.tank = req.params.tank;
                person.lastUpdate = new Date();
                db.collection('love').replaceOne({ email: req.params.email }, person, function (err) {
                    res.send("Updated");
                })
            }
        }
    });
}


module.exports = router;