var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;

router.get('/', GetMembers);
router.get('/:id', GetMember);
router.post('/:id/uploadDocument/:doc', UploadDocument);

function GetMembers(req, res) {
    var db = getDb();

    db.collection('members').find({}).toArray(function (err, members) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else res.send(members);
    });
}

function GetMember(req, res) {
    var db = getDb();

    db.collection('members').findOne({ _id: new ObjectID(req.params.id) }, function (err, doc) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else res.send(doc);
    });
}

function UploadDocument(req, res) {
    if (req.body.files) {
        var db = getDb();
        db.collection('documents').insertOne({ image: req.body.files }, function (err, image) {
            res.send(image.ops[0]._id);
        })
    }

    else return res.json({ 'error': 'No file' });
};

module.exports = router;