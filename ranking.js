const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
const excelToJson = require('convert-excel-to-json');
const path = require('path');
const async = require('async');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join(__dirname, 'results');
const { Parser } = require('json2csv');
//passsing directoryPath and callback function

initDb({}, function (err) {

    if (err) {
        throw err; //
    }
    var db = getDb();

    let ar = [];
    db.collection('TestResults').aggregate(l).toArray(function (err, results) {
        if (err) {
            console.log(err);
            return;
        }
        results.map(r => {

            //120
            let bigList = r.results.filter(c => c.cat == true);
            let c1 = bigList.map(r => parseFloat(r.points)).sort(function (a, b) { return a - b }).reverse().slice(0, 4).reduce((total, c) => total + c, 0);

            //80
            let smallList = r.results.filter(c => c.cat == false)
            let c2 = smallList.map(r => parseFloat(r.points)).sort(function (a, b) { return a - b }).reverse().slice(0, 5).reduce((total, c) => total + c, 0);

            if (parseFloat(r._id.Code) > 0 && (c1 + c2) > 0) {
                let o = {
                    code: r._id.Code, cat1: c1.toFixed(4), cat2: c2.toFixed(4), total: (c1 + c2).toFixed(4), age: r._id.age

                };
                ar.push(o);
            }
        });
        // console.log(ar);
        let i = 0;

        const fields = ['code', 'cat1', 'cat2', 'total'];

        const data = ar.sort(total);
        
        /*.map(r => {
            if(r.code==1542 || r.code==9351){
                console.log(r);
            }
            //else
            console.log(i + " " + r.code + ": " + r.cat1.toFixed(4) + ": " + r.cat2.toFixed(4) + ": " + r.total.toFixed(4) + ": " + r.age);
        })*/
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);
         
        console.log(csv);
    })

    function total(a, b) {
        return b.total - a.total
    }
    function less(a, b) {
        return a.cat2 - b.cat2
    }
    function more(a, b) {
        return a.cat1 - b.cat1
    }

});

const l =
    [{
        $match: {
            age: 'S'
        }
    }, {
        $project: {
            Code: 1,
            Ride: "$Ride",
            Distance: "$Distance",
            points: 1,
            cat: { $gte: ["$Distance", 120] },
            age: "$age"
        }
    },
    {
        $group: {
            _id: { Code: "$Code", age: "$age" },
            results: { $push: { Ride: "$Ride", Distance: "$Distance", points: "$points", cat: "$cat" } }
        }
    }
    ];


