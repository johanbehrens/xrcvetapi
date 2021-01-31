const { Slim } = require("../helpers/slim");
const async = require('async');
const rp = require('request-promise');

function DoWork(params, data, callback) {
    var failedRules = Validate(params);
    if (failedRules) return callback(failedRules);

    var toDo = [];

    async.forEachSeries(params.environments, function (environment, next) {
        toDo.push(async.apply(loadData, environment));
        next();
    }, function (err) {
        if (err) return callback(err);
        async.waterfall(toDo,
            function (err) {
                if (err) return callback(err);

                return callback();
            });
    });

    function loadData(config, next) {
        var slim = new Slim(config.host, config.client_id, config.client_secret);

        slim.connect((error, res) => {
            if (error) {
                return next(error);
            }
    
            slim.loadStats(function (err, response) {
                if (err) return next(err);
                return next();
            })
        });
      }
}

function Validate(params) {
    var rules = [];
    var template = Validation();
    template.forEach(temp => {
        if (temp.required) {
            if (!params[temp.name]) rules.push(`${temp.name} is missing`)
        }
    });

    if (rules.length > 0) return rules;
    else return null;
}

function Validation() {
    const template = [
        {
            type: 'string',
            required: true,
            name: 'environments'
        }
    ];

    return template;
}

module.exports = {
    Validation,
    DoWork
}