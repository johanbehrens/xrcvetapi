const initDb = require("./db").initDb;

var { enqueueJob } = require('./helpers/jobqueue');

initDb({}, function (err) {

    enqueueJob({
        jobName: 'workflow',
        data: {
            workflowId: '5dee231260099605f85280f0'
        },
    }, function (err, arg) {
        console.log(err)
        console.log(arg)
    })
    enqueueJob({
        jobName: 'workflow',
        data: {
            workflowId: '603cdd7436d30305340b876a'
        },
    }, function (err, arg) {
        console.log(err)
        console.log(arg)
    })
    enqueueJob({
        jobName: 'workflow',
        data: {
            workflowId: '603ce08036d30305340b8773'
        },
    }, function (err, arg) {
        console.log(err)
        console.log(arg)
    })
    
})
