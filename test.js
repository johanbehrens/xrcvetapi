const initDb = require("./db").initDb;

var { enqueueJob } = require('./helpers/jobqueue');

initDb({}, function (err) {
    enqueueJob({
        jobName: 'workflow',
        data: {
            workflowId: '605de24ab74fe509bb5d2522'
        },
    }, function (err, arg) {
        console.log(err)
        console.log(arg)
    })
})
