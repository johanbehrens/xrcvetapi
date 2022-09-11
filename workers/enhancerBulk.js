nodeMailer = require('nodemailer')
var async = require('async')

function DoWork(params, data, callback) {
    const jobFunctions = require("./jobs").Functions;

    console.log('Enhancer Bulk started');

    let resultSet = [];

    if (!jobFunctions[params.mapJob.jobName]) return callback('Job: ' + params.mapJob.jobName + ' was not found!');
    if (!params.mapJob.mapField) return callback('Mapping Field was not found! (mapJob.mapField)');

    jobFunctions[params.mapJob.jobName](params.mapJob, {}, gotData);

    function gotData(err, newData) {
       // console.log(newData);
        if (err) {
            console.log(err);
            return callback(err);
        }

        async.eachSeries(data.payload, leftJoin, combine);

        function leftJoin(element, next) {
            let item = element;
            let newItem = newData.payload.find(t => (t[params.mapJob.mapField]+'').toUpperCase() == (item[params.mapJob.mapField]+'').toUpperCase());

            if(newItem) {
              //  console.log(newItem)
            }

            resultSet.push({ ...item, ...newItem });
            next();
        }
    }

    function combine(err) {
        console.log('Enhancer Bulk finished');
        if (err) {
            console.log(err);
            return callback(err, null);
        }
        data.payload = resultSet;
        return callback(null, data);
    }
}

function Validation() {
    const template = [
        {
            type: 'job',
            required: true,
            description: 'Select a job to run for each of the objects passed in',
            name: 'mapJob'
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