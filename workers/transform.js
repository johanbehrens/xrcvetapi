const helper = require('../helpers/helper');
const mustache = require('mustache');

function transform(params, data, callback) {
    try {
        var failedRules = Validate(params);
        if (failedRules) return callback(failedRules);

        var transformedPayload = [];

        data.payload.forEach(row => {
            var out = mustache.render(params.template, row);
            var o = JSON.parse(out);
            transformedPayload.push(o);
        });

        data.payload = transformedPayload;

        return callback(null, data);
    }
    catch (err) {
        return callback(err);
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
            description: 'JSON String that can be converted using mustache',
            name: 'template'
        }
    ];

    return template;
}

module.exports = {
    transform,
    Validation
}