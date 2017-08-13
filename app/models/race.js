var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RaceSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    horses : [{ type: Schema.ObjectId, ref: 'Horse' }]
});

module.exports = mongoose.model('Race', RaceSchema);