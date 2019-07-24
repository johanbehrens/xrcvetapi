var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;

router.get('/:raceid', GetEntries);

function GetEntries(req, res) {
    var db = getDb();

    db.collection('entries').find({ }).toArray(function (err, entries) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else res.send(entries);
    });
}

module.exports = router;