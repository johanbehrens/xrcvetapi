var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;

router.post('/', AddTrack);

function AddTrack(req, res) {
    var db = getDb();
    db.collection('track').insertOne(req.body, function(err, doc){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else res.send(doc);
    });
}

module.exports = router;