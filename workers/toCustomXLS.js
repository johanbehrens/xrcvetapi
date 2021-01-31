"use strict";
const xlsx = require("xlsx");

function ToXLS(params, data, callback) {

    if (!params.headers) return callback('headers are required');
    if (!params.fileName) return callback('fileName is required');
    if (!data.payload) return callback('The data has no Payload');

    if (!params.sheetNames) return callback('sheetNames is required');

    let date = new Date();
    let tempFile = './temp/' + date + "_" + params.fileName;
    var wb = { SheetNames: [], Sheets: {} };

    var headers = params.headers.map(m => {
        if (!m.name) m.name = m.header;
        if (!m.width) m.width = 20;
        return m;
    });

    params.sheetNames.forEach((sheetName,key) => {
        if(Array.isArray(data.payload[key]))
        {
            var rows = data.payload[key];
        }
        else {
            var rows = data.payload;
        }

        var out = [];
        rows.forEach(item => {
            var newItem = {};
            headers.forEach(mapper => {
                newItem[mapper.name] = item[mapper.header];
            });
            out.push(newItem);
        });
    
        var ws = xlsx.utils.json_to_sheet(out, { header: headers.map(m => m.name) });
        ws['!cols'] = headers.map(m => { return { wch: m.width } });
    
        headers.forEach((header, index) => {
            if (header.format) {
                var range = { s: { r: 1, c: index }, e: { r: out.length, c: index } };
                for (var R = range.s.r; R <= range.e.r; ++R) {
                    for (var C = range.s.c; C <= range.e.c; ++C) {
                        var cell = ws[xlsx.utils.encode_cell({ r: R, c: C })];
                        if (!cell) continue; //  || cell.t != 'n' only format numeric cells
                        cell.z = header.format;
                    }
                }
            }
        });
    
        wb.SheetNames.push(sheetName);
        wb.Sheets[sheetName] = ws;
    });

    xlsx.writeFile(wb, tempFile);

    if (!data.attachments) {
        data.attachments = [];
    }
    data.attachments.push({
        filename: params.fileName,
        path: tempFile
    });

    return callback(null, data);
}

function Validation (){
  const template = [
      {
          type: 'string',
          required: true,
          name: 'fileName'
      }
  ];

  return template;
}

module.exports = {
    ToXLS,
    Validation
}

/*
var headers = [{
    header: 'Record No'
},
{
    header: 'ActionDateTime'
},
{
    header: 'Merchant Name'
},
{
    header: 'Operator'
},
{
    header: 'Merchant Narrative'
},
{
    header: 'Transaction Reference'
},
{
    header: 'Canister/Bag Serial No',
    name: 'Canister',
    width: { wch: 20 },
    format: '0'
},
{
    header: 'Declared Amount'
},
{
    header: 'Actual Amount'
},
{
    header: 'Shortage Surplus',
    name: 'Shortage',
    width: { wch: 20 },
    format: '0'
},
{
    header: 'Collected Time'
},
{
    header: 'Accept Time'
},
{
    header: 'Count Time'
},
{
    header: 'Bank Statement Date'
},
{
    header: 'Collected vs Accepted'
},
{
    header: 'Accepted vs Counted'
},
{
    header: 'Collected vs Counted'
},
{
    header: 'Collected vs Bank Statement'
},
{
    header: 'Accepted vs Bank Statement'
},
{
    header: 'Counted vs Bank Statement'
},
{
    header: 'Comments:Client'
},
{
    header: 'Comments:CIT'
},
{
    header: 'Comments:Cash Centre'
},
{
    header: 'Merchant Code'
},
{
    header: 'CIT Number'
},
{
    header: 'Device Serial Number'
},
{
    header: 'Cash Centre Name'
},
{
    header: 'Cash Centre Code'
},
{
    header: 'Bank Deposit ID'
},
{
    header: 'Transaction State'
}];
*/

/*
var workbook = xlsx.readFile('Bakwena.xlsx');
var first_sheet_name = workbook.SheetNames[0];
var worksheet = workbook.Sheets[first_sheet_name];
var j = xlsx.utils.sheet_to_json(worksheet);
*/

/*
j[0]['New name'] = j[0]['Transaction State'];
delete j[0]['Transaction State'];
console.log(j[0]);
*/

