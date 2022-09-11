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
                'file': 'Book4.csv',
                'delimiter': ';',
                "active": true
            },
            {
                "jobName": "onebase1",
                "active": true
            },
            {
                "jobName": "enhancerBulk",
                "mapJob": {
                    "jobName": "fileToJSON",
                    'file': 'mappings.csv',
                    'delimiter': ',',
                    "args": [],
                    "mapField": "Name"
                },
                "name": "",
                "active": true
            }, {
                "jobName": "toCustomXLS",
                "fileName": "K2 Historical Fund Returns.xlsx",
                "sheetNames": [
                    "Sheet1"
                ],
                "headers": [
                    {
                        "header": "Name"
                    },
                    {
                        "header": "ISIN Code"
                    },
                    {
                        "header": "Citicode / TIDM"
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
                "jobName": "sendEmail",
                "to": "behrens.johan@gmail.com,julie@onebase.co",
                "subject": "PerformanceSheet",
                "html": "<html>Hi,<br><br>See attached K2 Historical Fund Returns - ready for transformation.<br>Regards<br>Johan</html>",
                "active": true
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


