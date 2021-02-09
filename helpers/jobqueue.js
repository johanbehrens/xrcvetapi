'use strict';
const config = require("../config/database");
const monq = require('monq');
let _client = null;
let numberOfWorkers = 0;
let nextWorkerId = 0;

module.exports = {
    initialise,
    enqueue: {
        sendPushNotification,
        sendEmail
    },
    getDefaultQueue,
    createWorker,
    enqueueJob
};

function getDefaultQueue() {
    return _client.queue('default', { collection: 'jobs0' });
}

function initialise(app, callback) {
    _initialise();
    numberOfWorkers = config.workerCount;
    callback(null, app);
}

function _initialise() {
    _client = monq(config.database);
}

function createWorker(queueString, options) {
    return _client.worker(queueString, options);
}

function sendPushNotification(notification, callback) {
    const options = {
        attempts: {
            count: 1
        },
        priority: 100,
        delay: notification.scheduledDate
    };
    
    if (!_client) {
        _initialise();
    }
    console.log('sending PushNotification:'+notification);
    const queue = _client.queue('default', { collection: 'jobs0' });
    queue.enqueue('sendPushNotification', notification, options, callback);
}

function sendEmail(email, callback) {
    const options = {
        attempts: {
            count: 1
        },
        priority: 100,
        delay: email.scheduledDate
    };
    
    if (!_client) {
        _initialise();
    }
    console.log('sending Email:'+email);
    const queue = _client.queue('default', { collection: 'jobs0' });
    queue.enqueue('sendEmail', email, options, callback);
}

function enqueueJob({ jobName, data, priority, date }, callback) {
    const options = {
        attempts: {
            count: 1
        },
        priority: priority ? priority : 0
    };

    if(date) {
        options.delay = new Date(date);
    }

    if (!_client) {
        _initialise();
    }
    let queue = _client.queue('default', {
        collection: 'jobs' + getWorkerNumber()
    });
    queue.enqueue(jobName, data, options, callback);
}

function getWorkerNumber() {
    const chosenWorker = nextWorkerId;
    nextWorkerId++;
    if (nextWorkerId >= numberOfWorkers) {
        nextWorkerId = 0;
    }
    return chosenWorker;
}
