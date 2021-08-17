
var XLSX = require('xlsx')
var DBFFile = require ('dbffile').DBFFile;

    var workbook = XLSX.readFile('./members.xlsx');
    console.log(workbook.SheetNames);


let records = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

records = records.map(r => {
    return {
        CODE: r['Member Nr'] +'',
        SEN_JUN: r['Membership Type'].split(' ')[0].toUpperCase(),
        CLUBCODE: r['Club'],
        CALLNAME: r['Name'],
        NAME: r['Surname'],
        INITIALS: r['Name'][0],
        B_DATE: r['Date Of Birth']
    }
})

console.log(records);


let o ="NAME,C,35	INITIALS,C,4	CODE,C,7	CLUBCODE,C,30	CLUB,C,1	YEAR,C,1	PROV,C,1	MR_MRS,C,5	R_SEX,C,1	LANGUAGE,C,1	TELEPHONE,C,12	TELCODE,C,1	ADDRESS_1,C,22	ADDRESS_2,C,22	ADDRESS_3,C,22	CALLNAME,C,25	NCODE,C,30	B_DATE,C,11	OLDCODE,C,30	EMAIL,C,30	SEN_JUN,C,10"

let fieldDescriptors = [];

let y = o.split('	');
y.forEach(element => {
    let r = element.split(',');
    let t = { name: r[0], type: r[1], size: parseInt(r[2]) }
    fieldDescriptors.push(t);
});

async function testWrite() {
    try {
    let dbf = await DBFFile.create('./MEMBCODE.DBF', fieldDescriptors);
    console.log('DBF file created.');
    await dbf.appendRecords(records);
    console.log(`${records.length} records added.`);
    }
    catch(err){
        console.error(err);
    }
}
testWrite();
