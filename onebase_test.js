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
                "jobName": "fileToJSON",
                file:'indices.csv',
                delimiter: ',',
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
                        "header": "ISIN Code"
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
                "active" : true
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


