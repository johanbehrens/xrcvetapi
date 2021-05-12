var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
var { SendEmail } = require('../helpers/email');
const ISODate = Date;
const image2base64 = require('image-to-base64');
var { GetUserIds } = require('../helpers/user');
var { enqueue } = require('../helpers/jobqueue');
const async = require("async");
const user = require('../helpers/user');

router.post('/', AddLocation);

function AddLocation(req, res) {
    var db = getDb();

    console.log('Lora',req.body);
    
    db.collection('lora').insertOne(req.body, function (err, trackIn) {
        if (err) {
            console.log(err);
        }
        res.send();
    });
}

module.exports = router;