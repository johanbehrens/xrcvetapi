const { Surveil } = require("../helpers/surveil");
const config = require("../config/database.js");

function Metric(params, data, callback) {
    var failedRules = Validate(params);
    if(failedRules) return callback(failedRules);

    var surveil = new Surveil(config.surveil_username, config.surveil_password, params.resourceId);

    surveil.connect((error) => {
        if (error) {
            return callback(error);
        }

        var metrics = [];
        //validate
        data.payload.forEach(array => {
            array.forEach(r => {
                if(!r.key) return callback('Surveil key metric not in right format' + JSON.stringify(r));
                if(!r.value) return callback('Surveil value metric not in right format' + JSON.stringify(r));
                metrics.push(r);
            });
        });
        console.log('data.payload:',data.payload);

        surveil.metrics(metrics, params.resourceId, (error, resp) => {
            if (error) {
                return callback(error);
            }
            console.log('surveil response:',resp);
            return callback(null, resp);
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
            name: 'resourceId'
        }
    ];

    return template;
}

module.exports = {
    Validation,
    Metric
}