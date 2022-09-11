const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
var ObjectID = require('mongodb').ObjectID;


initDb({}, function (err) {

    if (err) {
        throw err; //
    }
    var db = getDb();

    db.collection('location').findOne({ _id: ObjectID("6197879a67634d2e2cc03211") }, function (err, result) {
        

        let newTrack = {
            "name": 'Elim 2021',
            "color": "blou",
            "leg": "1",
            "locations": result.locations.slice(2435).map((l,i) => {

               // if(i > 1367) return;
              //  if(l.speed < 1) console.log(i,l);
                
                return {
                    latitude: l.latitude,
                    longitude: l.longitude
                }
            })
        }

       // console.log(newTrack)

        
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
