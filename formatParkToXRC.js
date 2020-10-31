const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
var ObjectID = require('mongodb').ObjectID;


initDb({}, function (err) {

    if (err) {
        throw err; //
    }
    var db = getDb();

    db.collection('pr_results').findOne({ _id: ObjectID("5f95aef90ae4fd17051166b3") }, function (err, result) {
        

        let newTrack = {
            "name": result.description,
            "color": "blue",
            "leg": "1",
            "locations": result.coords.map(l => {
                return {
                    latitude: l.lat,
                    longitude: l.lng
                }
            })
        }

        db.collection('track').insertOne(newTrack, function (err, doc) {
            if (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            }
           console.log('done', err);
        });

    });
});
