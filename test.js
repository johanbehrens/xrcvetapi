const initDb = require("./db").initDb;

var { enqueueJob } = require('./helpers/jobqueue');

initDb({}, function (err) {

    enqueueJob({
        jobName: 'workflow',
        data: {
            workflowId: '60660ba12edaab303f14597c'
        },
    }, function (err, arg) {
        console.log(err)
        console.log(arg)
    })
    
})
