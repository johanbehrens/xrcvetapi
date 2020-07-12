const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
const excelToJson = require('convert-excel-to-json');
const path = require('path');
const async = require('async');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join(__dirname, 'results');
//passsing directoryPath and callback function
var ObjectID = require('mongodb').ObjectID;


initDb({}, function (err) {

    if (err) {
        throw err; //
    }
    var db = getDb();

    var leg = 1;
    db.collection('location').findOne({ _id: ObjectID("5e5a0ec2ab9be81eb5c272d6")}, function (err, location) {
        //.filter(f => f.leg == leg)
        let track = {
            userId: location.userId,
            name: location.username,
            leg,
            locations: location.locations.map(l => {
                return {
                    latitude: l.latitude,
                    longitude: l.longitude
                }
            })
        }
        db.collection('track').insertOne(track, function (err, trackIn) {
            if (err) {
                console.log(err);
            }
            db.collection('location').updateOne(
                { _id: ObjectID("5e5a0ec2ab9be81eb5c272d6") },
                {
                    $set: {
                        trackId: trackIn.ops[0]._id
                    }
                }, function (err, d) {
                    console.log('created');
                });
        });
    });
});
