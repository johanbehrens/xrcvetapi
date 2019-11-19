var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;

router.get('/view', ViewMeter);
router.post('/:meterId', AddMeter);

function ViewMeter(req, res) {
    var db = getDb();

    db.collection('elmicom').find({}).sort({ meterId: -1 }).toArray(function (err, doc) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            res.send(doc);
        }
    });
}

function AddMeter(req, response) {
    var db = getDb();

    db.collection('elmicom').updateOne(
        { meterId: req.params.meterId },
        {
            $set: {
                ...req.body,
                date: new Date()
            }
        },
        { upsert: true }, function (err, result) {
            if (err) {
                console.log(err);
                return response.send({'error: ': err.message});
            }
            response.send({ "message": "saved" });
        });
}


module.exports = router;