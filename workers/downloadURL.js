const fetch = require('node-fetch');
const mustache = require('mustache');

function Download(params, data, callback) {

    params.url = mustache.render(params.url, data);
    fetch(params.url)
        .then(res => res.json())
        .then(json => {
            //console.log(json);
            data.payload = json;

            if (params.lineItemDescription) {
                if (!data.invoice) {
                    data.invoice = {};
                }
                if (!data.invoice.lineItems) {
                    data.invoice.lineItems = [];
                }
                data.invoice.lineItems.push({
                    qty: data.payload.length,
                    description: params.lineItemDescription,
                    unitPrice: params.unitPrice
                });
            }

            return callback(null, data);
        })
        .catch(err => {
            console.log(err.message)
            callback(err.message)
        });
}

module.exports = {
    Download
}