'use strict';
const _ = require('lodash');
const config = require("../config/database");
const jobQueue = require('./jobqueue');

const jobFunctions = {
    sendPushNotification: require('./notification').SendNotification,
    sendEmail: require('./email').SendNotification,
    workflow: require('../workers/workflow').Workflow,
    validateSubscription: require('../workers/validateSubscription').Validate
};

const _logInfoForJob = (workerId, action, job) => {
    const attempts = _.get(job, 'attempts.count') || 1;
    const remainingAttempts = _.get(job, 'attempts.remaining') || attempts;
    const attemptNumber = attempts - remainingAttempts + 1;
    if (!job.error) {
        return console.log(
            '[Worker%s]Job "%s" %s, attempt %s/%s, id: %s',
            workerId,
            job.name,
            action,
            attemptNumber,
            attempts,
            job.id.toString()
        );
    }
    console.error(
        '[Worker%s]Job "%s" %s, attempt %s/%s, id: %s\n\n%s',
        workerId,
        job.name,
        action,
        attemptNumber,
        attempts,
        job.id.toString(),
        job.stack
    );
};

const _createWorker = (workerId) => {
    const options = {
        collection: 'jobs' + workerId
    };
    const worker = jobQueue.createWorker('*', options);

    worker.register(jobFunctions);

    worker.on('dequeued', function (data) {
        _logInfoForJob(workerId, 'de-queued', data);
    });

    worker.on('failed', function (data) {
        _logInfoForJob(workerId, 'failed', data);
    });

    worker.on('complete', function (data) {
        _logInfoForJob(workerId, 'complete', data);
    });

    worker.on('error', function (err) {
        console.error(workerId, 'Job error', err);
        throw err;
    });
    worker.start();
    return worker;
};

const startWorkers = (app, callback) => {
    for (let i = 0; i < config.workerCount; i++) {
        _createWorker(i);
    }
    return callback(null, app);
};

module.exports = {
    startWorkers
};
