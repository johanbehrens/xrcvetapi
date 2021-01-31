const getDb = require("../database").getDb;
var async = require('async')

function DoChecks(params, data, callback) {
    const { doNode } = require("../helpers/node");
    var date = new Date();
    console.log(date + ': Doing Alert Checks');
    var db = getDb();

    db.collection('alerts').find({ active: true }).toArray(function (err, alerts) {
        let torun = [];

        if (!alerts) return res.send([]);

        alerts.forEach(alert => {
            torun.push(async.apply(doNode, alert.workflowId, { ...alert }));
        });

        async.parallel(torun,
            (err, returnedData) => {
                if (err) {
                    return callback('error: ' + err.message);
                }

                async.each(
                    returnedData,
                    (element,next) => {
                        db.collection('alerts').updateOne(
                            {
                                _id: element._id
                            },
                            {
                                $set: {
                                    lastRun: new Date(),
                                    output: element.payload
                                }
                            },
                            { upsert: false }, function (err, result) {
                                if (err) return next('error: ' + err.message);
                                console.log('updated alert');
                                return next();
                            });
                    },
                    function(err){
                        if (err) return callback('error: ' + err.message);
                        return callback();
                    });
            }
        );
    });
}

function Validation() {
    const template = [
        {
            type: 'string',
            required: false,
            name: 'name'
        }
    ];

    return template;
}

module.exports = {
    DoChecks,
    Validation
}