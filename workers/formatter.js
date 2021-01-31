const helper = require('../helpers/helper');

function format(params, data, callback) {

    params.formatFields.forEach(e => {
        data.payload.forEach(element => {
            element[e.field] = helper[e.function](element[e.field]);
        });
    });
    
    return callback(null, data);
}

module.exports = {
    format
}