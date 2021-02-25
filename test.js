const initDb = require("./db").initDb;

var { enqueueJob } = require('./helpers/jobqueue');

initDb({}, function (err) {
    enqueueJob({
        jobName: 'workflow',
        data: {
            workflowId: '60365962be4f6b5648bd6195',
            params: {
                raceid: 448
            }
        },
    }, function (err, arg) {
        console.log(err)
        console.log(arg)
    })
})
