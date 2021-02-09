const { Azure } = require("../helpers/azure");
const config = require("../config/database");

function DoWork(params, data, callback) {
    var failedRules = Validate(params);
    if(failedRules) return callback(failedRules);

    var azure = new Azure(params.resource, params.tenantId, config.azure_clientId, config.azure_clientSecret);

    azure.connect((error) => {
        if (error) {
            return callback(error);
        }
        var d = JSON.stringify(params.query);
        azure.query(d,data,(err, response) => {
            if (err) {
                return callback(err);
            }
            data.payload = response;
            return callback(null,data);
        });
    });
}

function Validate(params) {
    var rules = [];
    var template = Validation();
    template.forEach(temp => {
        if(temp.required){
            if(!params[temp.name]) rules.push(`${temp.name} is missing`)
        }
    });
    
    if(rules.length > 0) return rules;
    else return null;
}

function Validation() {
    const template = [
        {
            type: 'string',
            required: true,
            name: 'resource'
        }, {
            type: 'string',
            required: true,
            name: 'tenantId'
        }, {
            type: 'object',
            required: true,
            name: 'query'
        }, {
            type: 'object',
            required: false,
            name: 'args'
        }
    ];

    return template;
}

module.exports = {
    DoWork,
    Validation
}