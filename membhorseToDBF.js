
var XLSX = require('xlsx')
var DBFFile = require ('dbffile').DBFFile;

    var workbook = XLSX.readFile('./horses_.xlsx');
    console.log(workbook.SheetNames);


let records = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

records = records.map(r => {
    return {
        HCODE: r['UV Code'],
        HORSE: r['Horse'],
        HORSE_DOB: r['Date of Birth'],
        SEX: r['Gender'],
        BREED: r['Breed'],
        COLOUR: r['Color']
    }
})

console.log(records);


let o ="HCODE,C,9	PASSPORT,C,10	HORSE,C,45	BREED,C,25	HORSE_DOB,C,10	SEX,C,1	COLOUR,C,12	HEAD,C,9	PREVIOUS,C,9	SIRE,C,36	DAM,C,36	SIRE_REG_N,C,9	DAM_REG_N,C,9	SIRE_BREED,C,15	DAM_BREED,C,15	OWNER,C,30	CLUBNO,C,8	REG_NO,C,15	LEG,C,9	BOOK_NO,N,19,0	PAID,C,1	ALIVE,C,1	COPIES,C,1	DATE_ISSUE,C,12"

let fieldDescriptors = [];

let y = o.split('	');
y.forEach(element => {
    let r = element.split(',');
    let t = { name: r[0], type: r[1], size: parseInt(r[2]) }
    fieldDescriptors.push(t);
});

async function testWrite() {
    try {
    let dbf = await DBFFile.create('./MEMBHORS.DBF', fieldDescriptors);
    console.log('DBF file created.');
    await dbf.appendRecords(records);
    console.log(`${records.length} records added.`);
    }
    catch(err){
        console.error(err);
    }
}
testWrite();
