const { Slim } = require("../helpers/slim");
const async = require('async');

function Aggregate(params, data, callback) {
    var failedRules = Validate(params);
    if (failedRules) return callback(failedRules);

    var results = [];
    var toDo = [];

    async.forEachSeries(params.environments, function (environment, next) {
        if (!environment.host) return next('host is missing');
        if (!environment.client_id) return next('client_id is missing');
        if (!environment.client_secret) return next('client_secret is missing');
        if (!environment.name) return next('name is missing');
        toDo.push(async.apply(getData, environment));
        next();
    }, function (err) {
        if (err) return callback(err);
        async.waterfall(toDo,
            function (err) {
                if (err) return callback(err);

                data.payload = results;
                return callback(null, data);
            });
    });

    function getData(config, next) {
        var slim = new Slim(config.host, config.client_id, config.client_secret);
    
        slim.connect((error, res) => {
            if (error) {
                return next(error);
            }
    
            slim.aggregateQuery(params.data, function (err, response) {
                if (err) return next(err);
                if (response) {
                    response.forEach(element => {
                        element.environment = config.name
                    });
                }
                results = [...results, ...response];
                next();
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
    Aggregate
}