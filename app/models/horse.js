var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HorseSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    distance: {
        type: String,
        required: true
    },
    HYDR: {
        type: String,
        required: false
    },
    HYDR0: {
        type: String,
        required: false
    },
    HYDR2: {
        type: String,
        required: false
    },
    HYDR3: {
        type: String,
        required: false
    },
    HYDR4: {
        type: String,
        required: false
    },
    HYDR5: {
        type: String,
        required: false
    },
    HYDR6: {
        type: String,
        required: false
    },
    HYDR1: {
        type: String,
        required: false
    },
    LOCO: {
        type: String,
        required: false
    },
    LOCO0: {
        type: String,
        required: false
    },
    LOCO1: {
        type: String,
        required: false
    },
    LOCO2: {
        type: String,
        required: false
    },
    LOCO3: {
        type: String,
        required: false
    },
    LOCO4: {
        type: String,
        required: false
    },
    LOCO5: {
        type: String,
        required: false
    },
    LOCO6: {
        type: String,
        required: false
    },
    HABI: {
        type: String,
        required: false
    },
    HABI0: {
        type: String,
        required: false
    },
    HABI1: {
        type: String,
        required: false
    },
    HABI2: {
        type: String,
        required: false
    },
    HABI3: {
        type: String,
        required: false
    },
    HABI4: {
        type: String,
        required: false
    },
    HABI5: {
        type: String,
        required: false
    },
    HABI6: {
        type: String,
        required: false
    },
    MEMB: {
        type: String,
        required: false
    },
    MEMB0: {
        type: String,
        required: false
    },
    MEMB1: {
        type: String,
        required: false
    },
    MEMB2: {
        type: String,
        required: false
    },
    MEMB3: {
        type: String,
        required: false
    },
    MEMB4: {
        type: String,
        required: false
    },
    MEMB5: {
        type: String,
        required: false
    },
    MEMB6: {
        type: String,
        required: false
    },
    CAP: {
        type: String,
        required: false
    },
    CAP0: {
        type: String,
        required: false
    },
    CAP1: {
        type: String,
        required: false
    },
    CAP2: {
        type: String,
        required: false
    },
    CAP3: {
        type: String,
        required: false
    },
    CAP4: {
        type: String,
        required: false
    },
    CAP5: {
        type: String,
        required: false
    },
    CAP6: {
        type: String,
        required: false
    },
    CAP: {
        type: String,
        required: false
    },
    CAP0: {
        type: String,
        required: false
    },
    CAP1: {
        type: String,
        required: false
    },
    CAP2: {
        type: String,
        required: false
    },
    CAP3: {
        type: String,
        required: false
    },
    CAP4: {
        type: String,
        required: false
    },
    CAP5: {
        type: String,
        required: false
    },
    CAP6: {
        type: String,
        required: false
    },
    GUT: {
        type: String,
        required: false
    },
    GUT0: {
        type: String,
        required: false
    },
    GUT1: {
        type: String,
        required: false
    },
    GUT2: {
        type: String,
        required: false
    },
    GUT3: {
        type: String,
        required: false
    },
    GUT4: {
        type: String,
        required: false
    },
    GUT5: {
        type: String,
        required: false
    },
    GUT6: {
        type: String,
        required: false
    },
    GWB: {
        type: String,
        required: false
    },
    GWB0: {
        type: String,
        required: false
    },
    GWB1: {
        type: String,
        required: false
    },
    GWB2: {
        type: String,
        required: false
    },
    GWB3: {
        type: String,
        required: false
    },
    GWB4: {
        type: String,
        required: false
    },
    GWB5: {
        type: String,
        required: false
    },
    GWB6: {
        type: String,
        required: false
    },
    COMMENT: {
        type: String,
        required: false
    },
    COMMENT0: {
        type: String,
        required: false
    },
    COMMENT1: {
        type: String,
        required: false
    },
    COMMENT2: {
        type: String,
        required: false
    },
    COMMENT3: {
        type: String,
        required: false
    },
    COMMENT4: {
        type: String,
        required: false
    },
    COMMENT5: {
        type: String,
        required: false
    },
    COMMENT6: {
        type: String,
        required: false
    },
    race : { type: Schema.ObjectId, ref: 'Race' }
});

HorseSchema.index({ code: 1, distance: 1}, { unique: true });

module.exports = mongoose.model('Horse', HorseSchema);