const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
const excelToJson = require('convert-excel-to-json');
const path = require('path');
const async = require('async');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join(__dirname, 'results');
//passsing directoryPath and callback function

function createCategories(r, cats) {
    let header = Object.keys(r);

    if (header.length == 1 && !cats.find(f => f.name == r[header])) {
        cats.push({ name: r[header], points: null });
        console.log("to add:" + r[header]);
    }
}

function makeResult(row, isFS = false, isStar = false, isYoung = true, isWorld = false, isChild = false, type, raceId, date, next) {
    var db = getDb();
    row.Distance = parseFloat(row.Distance);
    row.points = 0;

    if (!row.Disq && row['C/Speed'] && row.Distance >= 80) {
        row['C/Speed'] = parseFloat(row['C/Speed']);
        let point = 60;
        if (row.Distance >= 100) point = 70;
        if (row.Distance >= 120) point = 80;
        if (row.Distance >= 140) point = 100;
        if (isFS) point = 150;

        if (isStar) {
            if (row.Distance >= 120) point = 120;
            if (!isYoung && row.Distance >= 160) point = 150;
        }

        if (isWorld) {
            if (row.Distance >= 120) point = 150;
            if (!isYoung && row.Distance >= 160) point = 180;
        }
        row.age = isChild ? 'C' : (isYoung ? 'Y' : 'S');
        row.points = (row['C/Speed'] / 22) * point;
    }

    db.collection('location').updateOne(
        { type, raceId, date, riderNumber:row.Code },
        {
            $set: {
                ...row,
                type,
                raceId,
                date
            }
        },
        { upsert: true }, function (err, result) {
            next();
        });
}

function validate(row) {

    let headers = Object.keys(row);

    for (i = 0; i < headers.length; i++) {

        row[headers[i]] = row[headers[i]].split(',')[0];

        if (headers[i] == 'CompCode') continue;
        if (row[headers[i]] == 'Handiap' && headers[i] == 'H/Cap') continue;
        if (row[headers[i]] == 'POSITION' && headers[i] == 'Pos') continue;
        if (row[headers[i]].toLowerCase() == 'position,c,3' && headers[i].toLowerCase() == 'pos') continue;
        if (row[headers[i]].toLowerCase() == 'positon' && headers[i].toLowerCase() == 'pos') continue;
        if (row[headers[i]].toLowerCase() == 'hc' && headers[i].toLowerCase() == 'h/cap') continue;
        if (row[headers[i]].toLowerCase() == 'handicap' && headers[i].toLowerCase() == 'h/cap') continue;
        if (row[headers[i]].toLowerCase() == 'cor_spd' && headers[i].toLowerCase() == 'c/speed') continue;
        if (row[headers[i]].toLowerCase() == 'corr speed' && headers[i].toLowerCase() == 'c/speed') continue;
        if (row[headers[i]].toLowerCase() == 'corrected speed' && headers[i].toLowerCase() == 'c/speed') continue;
        if (row[headers[i]] == 'Correced Speed' && headers[i] == 'C/Speed') continue;
        if (row[headers[i]].toLowerCase() == 'club code' && headers[i].toLowerCase() == 'code') continue;
        if (row[headers[i]].toLowerCase() == 'no_r' && headers[i].toLowerCase() == 'code') continue;
        if (row[headers[i]].toLowerCase() == 'no' && headers[i].toLowerCase() == 'code') continue;
        if (row[headers[i]].toLowerCase() == 'code' && headers[i].toLowerCase() == 'club') continue;
        if (row[headers[i]].toLowerCase() == 'uv code' && headers[i].toLowerCase() == 'hcode') continue;
        if (row[headers[i]].toLowerCase() == 'slip1' && headers[i].toLowerCase() == 'slip') continue;
        if (row[headers[i]] == 'HORSE_FEI' && headers[i] == 'Horse FEI') continue;
        if (row[headers[i]].toLowerCase() != headers[i].toLowerCase()) return "|" + row[headers[i]] + "|" + ' is not ' + "|" + headers[i] + "|";
    }
    return '';
}

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
            if (file != 'COLESBURG 22 3 2019 (1).xls') return callback();
            let type = 'ERASA';
            let raceId = '405';
            let date = new Date('2019-03-22');

            console.log('Processing: ' + file);
            const results = excelToJson({
                sourceFile: directoryPath + '/' + file,
                columnToKey: {
                    A: "Pos",
                    B: "Code",
                    C: "Club",
                    D: "Rider",
                    E: "FEI",
                    F: "HCode",
                    G: "Horse",
                    H: "Horse FEI",
                    I: "Distance",
                    J: "Weight",
                    K: "Category",
                    L: "CompCode",
                    M: "Ride",
                    N: "Pulse",
                    O: "Pulse1",
                    P: "Pulse2",
                    Q: "Pulse3",
                    R: "Pulse4",
                    S: "Pulse5",
                    T: "Pulse6",
                    U: "Time1",
                    V: "Time2",
                    W: "Time3",
                    X: "Time4",
                    Y: "Time5",
                    Z: "Time6",
                    AA: "Slip",
                    AB: "Slip2",
                    AC: "Slip3",
                    AD: "Slip4",
                    AE: "Slip5",
                    AF: "Slip6",
                    AG: "TotSlip",
                    AH: "TotTime",
                    AI: "Speed",
                    AJ: "H/Cap",
                    AK: "C/Speed",
                    AL: "BestCon",
                    AM: "Disq",
                    AN: "Reason"
                }
            });

            let sheet = results.Sheet1;
            if (!sheet) {
                let sheets = Object.keys(results);
                if (sheets.length > 1) {
                    console.log('More than one sheet in file:' + file);
                }
                console.log('Sheet name is different in file:' + file + ": " + sheets[0]);

                sheet = results[sheets[0]];
            }

            let val = validate(sheet.shift());
            if (val != '') return callback(val);

            ///sheet = sheet.filter(r => !!r.Horse)
            sheet = sheet.filter(r => !!r.Distance)

            let cats = [
                { name: "80.0 km  Heavy Weight", base: 60 },
                { name: "80.0 km  Standard Weight", base: 60 },
                { name: "80.0 km  Light Weight", base: 60 },
                { name: "80.0 km  Young Rider", base: 60 },
                { name: "80.0 km  Trapleer", base: 0 },
                { name: "40.0 km Rider", base: 0 },
                { name: "Fail to Complete", base: 0 }];

            sheet.map(r => createCategories(r, cats));

            //console.log(cats);
            //sheet.map(r => );

            //return callback();

            async.eachSeries(sheet, function (r, next) {
                makeResult(r, false, r.Category.includes('*'), r.Category.toLowerCase().includes('young'), false, r.Category.toLowerCase().includes('child'), type, raceId, date,next);
            }, function (err) {
                console.log('next');
                if (err) {
                    return callback(err);
                }
                return callback();
            });

            /*
            db.collection('results').deleteMany({ raceId, date }, function (err) {
                db.collection('results').insertMany(sheet, function (err, l) {
                    if (err) {
                        return callback(err);
                    }
                    return callback();
                })
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
