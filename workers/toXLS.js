var json2xls = require('json2xls');
const fs = require('fs')

function ToXLS(params, data, callback) {
    var xls = json2xls(data.payload);
    let date = new Date();
    let tempFile = './temp/' + date + "_" + params.fileName;
    fs.writeFileSync(tempFile, xls, 'binary');

    if (!params.attachments) {
        params.attachments = [];
    }
    params.attachments.push({
        filename: params.fileName,
        path: tempFile
    });

    return callback(null, params);
}

module.exports = {
    ToXLS
}