var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport	= require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
const ISODate = Date;
const image2base64 = require('image-to-base64');

router.get('/:id', AddLocation);

function AddLocation(req, res) {
    var db = getDb();
    var id = new ObjectID(req.params.id);
        db.collection('profilepicture').findOne({_id: id}, function(err, doc){
            var img = new Buffer(doc.image, 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            });
            res.end(img); 
        });
}

module.exports = router;