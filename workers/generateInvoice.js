const { URLSearchParams } = require('url');
const getDb = require("../db").getDb;
const mustache = require('mustache');
var moment = require('moment');

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

        data.invoice.lineItems.map((item, i) => {
            data.invoiceParams.append('lineItem_' + i + '_qty', item.qty);
            data.invoiceParams.append('lineItem_' + i + '_description', item.description);
            data.invoiceParams.append('lineItem_' + i + '_unitPrice', item.unitPrice);
            data.invoice.amount += (item.qty * item.unitPrice);
        });

        data.invoice.paid = false;
        data.invoice.generated = new Date();

        db.collection('invoices').insertOne(data.invoice, function (err, invoiceIn) {
            if (err) {
                return callback(null, data);
            }
            else return callback(null, data);
        });
    }
}

module.exports = {
    Generate
}