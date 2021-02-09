const { Surveil } = require("../helpers/surveil");
const config = require("../config/database.js");

function Log(params, data, callback) {
    var surveil = new Surveil(config.surveil_username, config.surveil_password, params.resourceId);

    surveil.connect((error) => {
        if (error) {
            return callback(error);
        }
        if(!params.severity) params.severity = 'INFO';
        if (data && data.error) {
            params.log += data.error.message;
            params.severity = 'ERROR';
        }

        surveil.events('LogEvent', params.severity, params.log, (error, resp) => {
            return callback(null, params);
        });
    });
}

function Validation() {
    const template = [
        {
            type: 'string',
            required: true,
            name: 'resourceId'
        }, {
            type: 'string',
            required: true,
            name: 'username'
        }, {
            type: 'string',
            required: true,
            name: 'password'
        }, {
            type: 'string',
            required: true,
            name: 'log'
        }, {
            type: 'string',
            required: false,
            name: 'severity'
        }
    ];

    return template;
}

module.exports = {
    Log,
    Validation
}