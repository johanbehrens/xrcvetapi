'use strict';
const jobQueue = require('./helpers/jobqueue')
const async = require('async');
const { startWorkers } = require('./helpers/workers');
const initDb = require("./db").initDb;

async.waterfall(
    [
        async.apply(initDb, {}),
        jobQueue.initialise,
        startWorkers
    ],
    function(err) {
        if (err) {
            throw err;
        }
        console.log('Worker Started');
    }
);
