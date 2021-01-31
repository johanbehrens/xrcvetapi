nodeMailer = require('nodemailer')
const config = require("../config/app-config.json");
const doNode = require("../helpers/node").doNode;
var async = require('async')

function DoWork(params, data, callback) {
    const jobFunctions = require("./jobs").Functions;

    console.log('Enhancer started');
   
    let resultSet = [];
    async.eachSeries(data.payload, runQuery, combine);


    function runQuery(element, next) {
        

        if (!jobFunctions[params.mapJob.jobName]) return next('Job: ' + params.mapJob.jobName + ' was not found!');

        jobFunctions[params.mapJob.jobName](params.mapJob, element, doneNode);

        //doNode(params.mapJob, element, doneNode);

        function doneNode(err, nodeData) {
            console.log(nodeData);
            if (err) {
                console.log(err);
                return next();
            }
            else if (nodeData.payload && nodeData.payload.length > 0) {
                //resultSet.push({ ...element, ...nodeData.payload[0] });

                nodeData.payload.forEach(tupe => {
                    if(Array.isArray(tupe)) {
                        tupe.forEach(im => addItem(im));
                    }
                    else {addItem(tupe);}
                });

                function addItem(itm){
                    var newO = { ...element, ...itm };
                    resultSet.push(trans({},newO));
                }
                
                return next();
            }
            resultSet.push(trans({}, { ...element }));
            return next();
        }
    };

    function combine(err) {
        console.log('Enhancer finished');
        if (err) {
            console.log(err);
            return callback(err, null);
        }
        data.payload = resultSet;
        return callback(null, data);
    }

    function trans(modelObj, arg) {
        if (params.mapper) {
            let returnObj = {};
            let keys = Object.keys(params.mapper);
            keys.forEach(key => {
                returnObj[params.mapper[key]] = arg[key];
            });
            return returnObj;
        }
        return arg;
    }
}

function Validation() {
    const template = [
        {
            type: 'job',
            required: true,
            description:'Select a job to run for each of the objects passed in',
            name: 'mapJob'
        }, {
            type: 'object',
            required: true,
            description:'Rename columns to new names (ex: name: Name)',
            name: 'mapper'
        }
    ];

    return template;
}

function Inputs() {

}

module.exports = {
    DoWork,
    Validation,
    Inputs
}