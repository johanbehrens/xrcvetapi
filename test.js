const initDb = require("./db").initDb;

var { enqueueJob } = require('./helpers/jobqueue');

initDb({}, function (err) {
    enqueueJob({ jobName:'workflow', 
    data: {workflowId:'602219c20ea5e90e90d74e2c'}, 
}, function(err, arg){
    console.log(err)
    console.log(arg)
}) 
})



