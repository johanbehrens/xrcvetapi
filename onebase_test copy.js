"use strict";

const initDb = require("./db").initDb;
const workflow = require("./workers/workflow");

//

initDb({}, function () {


    workflow.DoWork({
        "name": "Email CIMA Devices - Surveil",
        "params": {

        },
        "queue": [
            {
                "jobName": "downloadURL",
                returnRaw: true,
                url: 'https://www.feanalytics.com/PlotData/PerformanceSheet.asmx/PerformanceSeries?sid=dbb9ce6e-45a5-ec11-b1d5-002248818b97&UserID=40D3C036-BC67-4A9B-9DC7-AC9B221AAF96',
                "active": true
            },
            {
                "jobName": "stringToJSON",
                delimiter: '\t',
                "active": true
            },
            {
                "jobName": "onebase",
                "active": true
            }, {
                "jobName": "toCustomXLS",
                "fileName": "PerformanceSheet.xlsx",
                "sheetNames": [
                    "Sheet1"
                ],
                "headers": [
                    {
                        "header": "FundName"
                    },
                    {
                        "header": "Date"
                    },
                    {
                        "header": "Value"
                    }
                ],
                "active": true
            }, 
            {
                "jobName" : "sendEmail",
                "to" : "behrens.johan@gmail.com,julie@onebase.co",
                "subject" : "PerformanceSheet",
                "html" : "<html>Hi,<br><br>See attached PerformanceSheet Reports.<br>Regards<br>Johan</html>",
                "active" : false
            }
        ],
        "environment": "PROD"
    }, next)


    function next(err, data) {
        if (err) {
            console.log(err);
        }
        console.log('done', data)

        /*
        if (data && data.payload) {
            if (data.payload.columns) {
                Object.keys(data.payload.columns).forEach(element => {
                    console.log('{"header":"' + element + '"},');
                });
            }
        }
        */
    }


});


