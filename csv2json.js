const fs = require('fs')
var parse = require('csv-parse')

var XLSX = require('xlsx')
var DBFFile = require ('dbffile').DBFFile;

fs.readFile('./csv_all_horses.csv', function (err, fileData) {
    console.log(err)
    parse(fileData, { columns: false, header: false, trim: true }, function (err, records) {

        records.shift();
        records = records.map(r => {
            return {
                HCODE: r[0],
                HORSE: r[1],
                HORSE_DOB: r[3],
                SEX: r[4],
                BREED: r[2],
                COLOUR: r[5],
                NOVICE: r[6],
                ACTIVE: r[7] == '0' ? '1' : '0'
            }
        }).filter(t => t.ACTIVE === '1')

        console.log(records);

        let o = "HCODE,C,9	PASSPORT,C,10	HORSE,C,45	BREED,C,25	HORSE_DOB,C,10	SEX,C,1	COLOUR,C,12	HEAD,C,9	PREVIOUS,C,9	SIRE,C,36	DAM,C,36	SIRE_REG_N,C,9	DAM_REG_N,C,9	SIRE_BREED,C,15	DAM_BREED,C,15	OWNER,C,30	CLUBNO,C,8	REG_NO,C,15	LEG,C,9	BOOK_NO,N,19,0	PAID,C,1	ALIVE,C,1	COPIES,C,1	DATE_ISSUE,C,12	NOVICE,C,1	ACTIVE,C,1"

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
            catch (err) {
                console.error(err);
            }
        }
        testWrite();



    })
})

