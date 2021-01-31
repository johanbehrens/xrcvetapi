const { ExportToCsv } = require("export-to-csv");
const fs = require('fs')

function ToCSV(params, data, callback) {

    const options = {
        filename: params.fileName,
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        showTitle: false,
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true
    };

    const exportToCsv = new ExportToCsv(options);
    const csvData = exportToCsv.generateCsv(data.payload, true);
    let date = new Date();
    let tempFile = './temp/' + '_' + date + params.fileName;

    fs.writeFileSync(tempFile, csvData)

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
    ToCSV
}