const { URLSearchParams } = require('url');
const getDb = require("../db").getDb;
const mustache = require('mustache');
var moment = require('moment');
var { Download } = require('./downloadURL');

function Generate(params, data, callback) {
    var db = getDb();
    let invoiceNumber = 0;

    db.collection('invoices').find({ clientName: params.invoice.clientName }).toArray(function (err, invoices) {
        if (err) {
            return callback(null, data);
        }
        invoiceNumber = invoices.length + 1;
        RetrievedInvoices();
    });

    function RetrievedInvoices() {

        if (!data.invoice) {
            data.invoice = params.invoice;
        }
        else {
            data.invoice = { ...data.invoice, ...params.invoice }
        }

        if (!data.invoice.lineItems) {
            data.invoice.lineItems = [];
        }

        if (params.lineItems) {
            /*
                "qty" : 1.0, 
                "description" : "Monthly Website Hosting", 
                "unitPrice" : 200.0
            */
            data.invoice.lineItems = [...params.lineItems, ...data.invoice.lineItems];
        }

        data.invoiceParams = new URLSearchParams();

        data.invoiceParams.append('invoiceNumber', params.invoice.preFix + (('00000' + invoiceNumber).slice(-5)));
        data.invoiceParams.append('invoiceDescription', params.invoice.invoiceDescription);

        data.invoiceParams.append('entityId', params.invoice.entityId);

        data.invoiceParams.append('clientName', params.invoice.clientName);
        data.invoiceParams.append('personName', params.invoice.personName);
        data.invoiceParams.append('personEmail', params.invoice.personEmail);

        data.invoiceParams.append('bankLine1', params.invoice.bankLine1);
        data.invoiceParams.append('bankLine2', params.invoice.bankLine2);
        data.invoiceParams.append('bankLine3', params.invoice.bankLine3);

        data.invoice.currentDate = mustache.render(params.invoice.currentDate, data);
        data.invoiceParams.append('currentDate', data.invoice.currentDate);
        data.invoiceParams.append('invoiceDate', moment().format('YYYY-MM-DD'));

        data.invoice.amount = 0;
        data.invoice.invoiceNumber = invoiceNumber;
        data.invoice.invoiceRef = params.invoice.preFix + (('00000' + invoiceNumber).slice(-5));
        data.invoice.paid = false;
        data.invoice.generated = new Date();

        data.invoice.lineItems.map((item, i) => {
            data.invoiceParams.append('lineItem_' + i + '_qty', item.qty);
            data.invoiceParams.append('lineItem_' + i + '_description', item.description);
            data.invoiceParams.append('lineItem_' + i + '_unitPrice', item.unitPrice);
            data.invoice.amount += (item.qty * item.unitPrice);
        });

        let invoice = {};
        invoice.clientName = params.invoice.clientName;
        invoice.toEmail = params.invoice.personEmail;
        invoice.entityId = params.invoice.entityId;
        invoice.to = params.invoice.personName;
        invoice.invoiceDate = moment().format('YYYY-MM-DD');
        invoice.invoiceTemplateId = params.invoice.invoiceTemplateId; //
        invoice.eventType = params.invoice.eventType; //
        invoice.eventName = params.invoice.invoiceDescription;
        invoice.eventDate = data.invoice.currentDate;
        invoice.preFix = params.invoice.preFix;
        invoice.invoiceNr = (('00000' + invoiceNumber).slice(-5));

        invoice.descriptions = data.invoice.lineItems.map((item, i) => {
            return {
                description: item.description,
                qty: item.qty,
                price: item.unitPrice
            }
        });

        Download({
            "url": params.invoice.url,
            method: 'POST',
        }, invoice, done);

        function done(err) {
            db.collection('invoices').insertOne(data.invoice, function (err, invoiceIn) {
                if (err) {
                    return callback(null, data);
                }
                else return callback(null, data);
            });
        }
    }
}

module.exports = {
    Generate
}