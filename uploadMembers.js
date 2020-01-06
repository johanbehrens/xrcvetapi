const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
const excelToJson = require('convert-excel-to-json');
const path = require('path');
const async = require('async');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join(__dirname, 'members');
//passsing directoryPath and callback function


initDb({}, function (err) {

    if (err) {
        throw err; //
    }
    var db = getDb();

    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        async.eachSeries(files, function (file, callback) {
            if (file != 'GRC_Members.xlsx') return callback();

            console.log('Processing: ' + file);
            const results = excelToJson({
                sourceFile: directoryPath + '/' + file
            });

            let sheet = results.Export;
            if (!sheet) {
                let sheets = Object.keys(results);
                if (sheets.length > 1) {
                    console.log('More than one sheet in file:' + file);
                }
                console.log('Sheet name is different in file:' + file + ": " + sheets[0]);

                sheet = results[sheets[0]];
            }

          //  let val = validate(sheet.shift());
          //  if (val != '') return callback(val);

            ///sheet = sheet.filter(r => !!r.Horse)
           // sheet = sheet.filter(r => !!r.Distance)

           // sheet.map(r => createCategories(r, cats));


           var members = [];
            async.eachSeries(sheet, function (r, next) {
                if(!r.E) return next();
                if(r.E == 'Email address') return next();

                var mem = { 
                    "name" : r.B,
                    "surname" : r.C,
                    "email" : r.E,
                    "cell" : r.F,
                    "dob" : new Date(r.G), 
                    "ethnic" : r.H,
                    "physical" : r.I,
                    "postal" : r.J,
                    "province" : r.K,
                    "region" : r.L,
                    "country" : "ZA", 
                    "idnumber" : r.M, 
                    "doc_id" : undefined,
                    "doc_indemnity" : undefined,
                    "doc_consent" : undefined
                };
                
                mem.Memberships = [
                        {
                            "type" : "ERASA", 
                            "number" : r.A,
                            "membership": "full",
                            "active": false,
                            "year": 2019
                        },
                        {
                            "type" : "WCERA", 
                            "number" : undefined,
                            "membership": "full",
                            "active": false,
                            "year": 2019
                        },
                        {
                            "type" : "GRC",
                            "number" : undefined,
                            "membership": "full",
                            "active": false,
                            "year": 2019
                        }
                    ];

                    db.collection('members').updateOne(
                        { idnumber:mem.idnumber, name:mem.name, surname:mem.surname },
                        {
                            $set: {
                                ...mem
                            }
                        },
                        { upsert: true }, function (err, result) {
                            next();
                        });
                       
            }, function (err) {
                console.log('next');
                if (err) {
                    return callback(err);
                }
                return callback();
            });

            /*
            db.collection('location').deleteMany({ raceId, date: new Date('2019-06-') }, function (err) {
                console.log('deleted');
            });
            */

        }, function (err) {
            if (err) {
                console.log(err);
            }
            console.log('done');
        });


    });




});
