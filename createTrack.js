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

    db.collection('location').findOne({ _id: ObjectID("5d3ad88cb4166f47990872bb") }, function (err, location) {
        let track = {
            userId: location.userId,
            name: location.username,
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
                { _id: ObjectID("5d3ad88cb4166f47990872bb") },
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
