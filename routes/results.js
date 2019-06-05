var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);

router.get('/:type/:id', GetResults);

function GetResults(req, res) {
    var db = getDb();

    console.log('GetResults');
    db.collection('results').find({type:req.params.type,raceId: req.params.id}).sort({date:1,Category:1}).toArray(function (err, locations) {
        console.log('return GetResults');
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

module.exports = router;