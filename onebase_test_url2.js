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
                    'delimiter': ';',
                    "args": [],
                    "mapField": "Name"
                },
                "name": "",
                "active": true
            }, {
                "jobName": "toCustomXLS",
                "fileName": "PerformanceSheet.xlsx",
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
                        "header": "Code"
                    },
                    {
                        "header": "Date"
                    },
                    {
                        "header": "Value"
                    }
                ],
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


