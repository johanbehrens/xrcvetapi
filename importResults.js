const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
const excelToJson = require('convert-excel-to-json');
const path = require('path');
const async = require('async');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join(__dirname, 'results', 'FS_UIT1_DAY2.DBF');
//passsing directoryPath and callback function
var ObjectID = require('mongodb').ObjectID;
var Parser = require('node-dbf');
import { DBFFile } from 'dbffile';


async function testRead() {
    let dbf = await DBFFile.open(directoryPath);
    console.log(`DBF file contains ${dbf.recordCount} records.`);
    console.log(`Field names: ${dbf.fields.map(f => f.name).join(', ')}`);
    let records = await dbf.readRecords(dbf.recordCount);
    return records;
}

let date = new Date(new Date('2019-07-03').toISOString().split('T')[0]);
var clientServerDiff = 0;
let type = 'ERASA';
let raceid = '284';

testRead().then(items => {

console.log(items.length);
    items.map(i => {
        i.raceId = raceid;
        i.type = type;
        i.date = date;
        i.diff = clientServerDiff;
    });

    initDb({}, function (err) {

        if (err) {
            throw err; //
        }
        var db = getDb();

        /*
        db.collection('location').deleteMany({ raceId: raceid, date }, function (err) {
            console.log('deleted');
        });
        */

        
        async.eachSeries(items, function (item, callback) {
            db.collection('location').updateOne(
                { type, raceId: raceid, date, riderNumber: item.NO },
                {
                    $set: {
                        ...item,
                        type,
                        raceId : raceid,
                        date
                    }
                },
                { upsert: true }, function (err, result) {
                    callback();
                });
        }, function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('success');
            }
        });
    });
});



/*
initDb({}, function (err) {

    if (err) {
        throw err; //
    }
    var db = getDb();

   // db.collection('location').findOne({ _id: ObjectID("5d1ae33db62faf1420badfa2") }, function (err, location) {


var parser = new Parser('../results/FSUIT1BCK19.DBF');
        parser.on('start', function(p) {
            console.log('dBase file parsing has started');
        });

        parser.on('header', function(h) {
            console.log('dBase file header has been parsed',h);
        });

        parser.on('record', function(record) {
            console.log(record);
        });

        parser.on('end', function(p) {
            console.log('done');
        });

        parser.parse();
    //});
});
*/