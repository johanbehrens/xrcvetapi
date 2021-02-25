var async = require('async')
const getDb = require("../db").getDb;
const jobFunctions = require("./jobs").Functions;
const helper = require("../helpers/helper");
var ObjectId = require('mongodb').ObjectID;

function Workflow(data, callback) {
    var db = getDb();
    if(typeof data.workflowId != 'object') data.workflowId = ObjectId(data.workflowId);
    db.collection('workflows').findOne({ _id: data.workflowId }, function (err, workflow) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        else if (!workflow) {
            err = { message: 'Workflow not found!' };
            console.log(err);
            return callback(err);
        }
        else {
            if(data.params) {
                if(workflow.params) workflow.params = {...workflow.params, ...data.params};
                else workflow.params = {...data.params}
            }
            DoWork(workflow, callback);
        }
    });
}

function DoWorkWithFilter(workflow, filters, callback) {
    workflow.queue.forEach(job => {
        job.filters = filters;
    });
    return DoWork(workflow, callback);
}

function DoWork(workflow, callback) {
    console.log('Starting workflow: ' + workflow.name);
    let torun = [];
    if (workflow.params) {
        Object.keys(workflow.params).forEach(param => {
            if (typeof workflow.params[param] == 'object' && param != 'filters' && workflow.params[param] != null) {
                workflow.params[param] = helper[workflow.params[param].function](...workflow.params[param].args);
            }
        });
    }
    torun.push(async.apply(jobFunctions.startDeployment, workflow, workflow.params));

    if (!workflow.queue) return callback('No queue found for workflow: ' + workflow.name);

    var valid = [];
    workflow.queue.forEach(job => {
        if (!jobFunctions[job.jobName]) valid.push('Job: ' + job.jobName + ' was not found!');

        if(job.active == undefined || job.active == true) torun.push(async.apply(jobFunctions[job.jobName], job));
    });

    if (valid.length > 0) return callback(valid);
    Run(torun, workflow, callback);
}


function Run(torun, workflow, callback) {
    async.waterfall(torun,
        (err, returnedData) => {
            if (err) {
                console.log(err);
                if (workflow.onFailed) {
                    jobFunctions[workflow.onFailed.jobName](workflow.onFailed, err, callback);
                }
                else return callback(err,returnedData);
            }
            else if (workflow.onSuccess) {
                jobFunctions[workflow.onSuccess.jobName](workflow.onSuccess, err, callback);
            }
            else return callback(null,returnedData);
        }
    );
}

module.exports = {
    Workflow,
    Run,
    DoWork,
    DoWorkWithFilter
}