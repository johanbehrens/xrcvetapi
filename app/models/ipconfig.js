var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IpConfigSchema = new Schema({
    identifier: {
        type: String,
        unique: true,
        required: true
    },
    ip: {
        type: String,
        unique: false,
        required: false
    },
    port: {
        type: String,
        unique: false,
        required: false
    }
});

module.exports = mongoose.model('IpConfig', IpConfigSchema);