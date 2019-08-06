const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
const ObjectId = require("mongodb").ObjectId;
const excelToJson = require('convert-excel-to-json');
const path = require('path');
const async = require('async');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join(__dirname, 'results');
//passsing directoryPath and callback function



initDb({}, function (err) {

    if (err) {
        throw err; //
    }
    var db = getDb();

    Date.prototype.addHours = function (h) {
        this.setTime(this.getTime() + (h * 60 * 60 * 1000));
        return this;
    }

    function calcLeg(stamp, loc, leg) {
        let stamp2 = new Date(stamp);
        let stamp3 = new Date(stamp);
        let h = loc['TIME' + leg].split(':');
        stamp2.setHours(...h);
        h = loc['TIME' + (leg + 1)].split(':');
        stamp3.setHours(...h);

        console.log('1: ' + leg + " " + stamp);
        console.log('2: ' + stamp2);
        console.log('3: ' + stamp3);

        return (stamp >= stamp2 && stamp <= stamp3);
    }

    db.collection('location').findOne({ _id: ObjectId("5d3bd8e4b4166f47990872ca") }, function (err, loc) {

        var i = loc.locations.length;
        while (i--) {
            let stamp = new Date(loc.locations[i].timestamp);
            stamp = stamp.addHours(-2);
            if (calcLeg(stamp, loc, 1)) loc.locations[i].leg = 1;
            else if (calcLeg(stamp, loc, 3)) loc.locations[i].leg = 2;
            else if (calcLeg(stamp, loc, 5)) loc.locations[i].leg = 3;
            else if (calcLeg(stamp, loc, 7)) loc.locations[i].leg = 4;
            else if (calcLeg(stamp, loc, 9)) loc.locations[i].leg = 5;
            else if (calcLeg(stamp, loc, 11)) loc.locations[i].leg = 6;
           
            /*
           if(!loc.locations[i].leg) loc.locations.splice(i, 1);
           else if(loc.locations[i].speed < 0.5 && i > 10) loc.locations.splice(i, 1);
           else console.log(loc.locations[i].leg);
           */
        }

        
        db.collection('location').updateOne(
            { _id: loc._id },
            {
                $set: {
                    locations: loc.locations
                }
            },
            { upsert: false }, function (err, result) {
                console.log('done: ' + err);
            });
    });

});
