"use strict";

const initDb = require("./db").initDb;
const workflow = require("./workers/workflow");

initDb({}, function () {


    workflow.DoWork({"name" : "Email CIMA Devices - Surveil", 
    "params" : {

    }, 
    "queue" : [
        {
            "jobName" : "generateInvoice",
            "invoice" : {
                "preFix" : "XDA",
                "personName" : "Cindy",
                "personEmail" : "johan@xrc.co.za",
                "invoiceDescription" : "DRASA Monthly Invoice",
                "clientName" : "DRASA",
                "bankLine1" : "Account Holder: J Behrens",
                "bankLine2" : "Bank: ABSA | Acc Nr: 406 252 9670",
                "bankLine3" : "Branch: 632 005",
                "entityId" : "60ed6f84bd777c169535213d",
                "invoiceDate" : "{{invoiceDate}}",
                "currentDate" : "{{invoiceDate}}",
                "invoiceTemplateId" : "603ead57800d290ff9e25d41",
                "entityId" : "60ed6f84bd777c169535213d",
                "eventType" : "REGISTRATIONS",
                "entityId":"60ed6f84bd777c169535213d",
                "url" : "http://localhost:8080/api/auto/603eacb3800d290ff9e25d40/invoices/"
            },
            "lineItems" : [ 
                {
                    "qty" : 1.0,
                    "description" : "Monthly Website Hosting",
                    "unitPrice" : 200.0
                }
            ],
            "active" : true
        }, , 
    ], 
    "environment" : "PROD"}, next)


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


