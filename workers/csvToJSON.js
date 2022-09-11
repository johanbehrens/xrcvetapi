const csv = require("csvtojson");

function fromString(params, data, callback) {
    csv({ delimiter: params.delimiter }).fromString(data.payload).then((csvRow) => {
        data.payload = csvRow;
        return callback(null, data);
    })
}

function fromFile(params, data, callback) {
    csv({ delimiter: params.delimiter, flatKeys: true }).fromFile(params.file).then((csvRow) => {
        data.payload = csvRow;
        return callback(null, data);
    })
}

module.exports = {
    fromString,
    fromFile
}