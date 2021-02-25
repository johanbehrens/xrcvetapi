var async = require('async')
var { enqueueJob } = require('../helpers/jobqueue');
var ObjectID = require('mongodb').ObjectID;

function DoWork(params, data, callback) {
    console.log('Enhancer Workflow started');
   
    async.eachSeries(data.payload, enqueuWorkflow, done);

    function enqueuWorkflow(element, next) {
       
        return enqueueJob({
            jobName: 'workflow',
            data: {
                workflowId: params.workflowId,
                params: {...element}
            },
        }, function (err, arg) {
            if(err) next(err);
            else next();
        })
    };

    function done(err) {
        return callback(null, data);
    }
}

module.exports = {
    DoWork
}