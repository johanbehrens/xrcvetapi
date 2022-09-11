const fs = require('fs')
var parse = require('csv-parse')
const initDb = require("./db").initDb;
const getDb = require("./db").getDb;
var ObjectID = require('mongodb').ObjectID;


fs.readFile('./elmicom.csv', function (err, fileData) {
    //     console.log(fileData);

    const records = [];
    // Initialize the parser
    const parser = parse(fileData, {
        delimiter: ';',
        columns: true
    });
    // Use the readable stream api to consume records
    parser.on('readable', function () {
        let record;
        while ((record = parser.read()) !== null) {
            records.push(record);
        }
    });
    // Catch any error
    parser.on('error', function (err) {
        console.error(err.message);
    });
    // Test that the parsed records matched the expected records
    parser.on('end', function () {

        initDb({}, function (err) {

            if (err) {
                throw err; //
            }
            var db = getDb();

            function camelize(str) {
                return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
                    return index === 0 ? word.toLowerCase() : word.toUpperCase();
                }).replace(/\s+/g, '');
            }


            let t = [];

            let r = records.map((i, index) => {

                let newRow = {};


                Object.keys(i).map(key => {
                    let ks = camelize(key);

                    if (ks.toLowerCase() == 'companyname') ks = 'name';
                    if (ks == 'companyMainTelephoneNumber') ks = 'companyPhoneNumber';
                    if (ks == 'mainContactNameAndSurname') ks = 'contactName';
                    if (ks == 'mainContactEmailAddress') ks = 'contactEmailAddress';
                    if (ks == 'mainContactCellphoneNumber') ks = 'contactCellNumber';
                    if (ks == 'pABXMake') ks = 'PABXMake';
                    if (ks == 'pABXModel') ks = 'PABXModel';
                    if (ks == 'pABXSerialNumber') ks = 'PABXSerialNumber';
                    if (ks == 'emailAddressAccounts') ks = 'email';
                    if (ks == 'lTESimCellNo') ks = 'LTESimCellNo';
                    if (ks == 'lTESerialNumber') ks = 'LTESerialNumber';
                    if (ks == 'tMSType') ks = 'TMSType';

                    if (index == 0) {
                        t.push({
                            "type": "text",
                            "description": ks,
                            "label": key
                        })
                    }

                    newRow[ks] = i[key];
                });

                return {
                    ...newRow,
                    userId: ObjectID('61e2a0489b5cb743f5a01824'),
                    companyId: ObjectID('61e2a08c9b5cb743f5a01825'),
                    entityTemplateId: "61e2a08c9b5cb743f5a01826",
                    //email: i.contactEmailAddress
                }
            });

            console.log(t)



            /*
            db.collection('monarc_entities').deleteMany({
                userId: ObjectID('61e2a0489b5cb743f5a01824'),
                    companyId: ObjectID('61e2a08c9b5cb743f5a01825')
            },function (err, doc) {
                console.log(doc.length);
              
            });
          */

            /*
             r.forEach(element => {
           
            db.collection('monarc_entities').updateOne(
                { companyId: ObjectID('61e2a08c9b5cb743f5a01825'), databaseNumber: element.databaseNumber },
                {
                    $set: {
                        ...element
                    }
                },
                { upsert: true }, function (err, d) {
                    if(err) console.log(err);
                });
             });
             */
        });
    });
});
