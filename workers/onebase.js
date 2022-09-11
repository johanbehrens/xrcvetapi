const csv = require("csvtojson");
const moment = require("moment");

function transform(params, data, callback) {

    let d = [];

    data.payload.forEach(element => {
        let l = {};

        Object.keys(element).forEach((e, index) => {
            if (index == 0) l.FundName = element[e];
            if (index == 2) l.FundCode = element[e];

            if (index > 2) {
                l.Date =  e.substring(42,53);
                l.Value = element[e];
                d.push({...l});
            }
            
        });
    });
    data.payload = d;
    return callback(null, data);
}


function transform1(params, data, callback) {

    let d = [];

    data.payload.forEach(element => {
        let l = {};

        Object.keys(element).forEach((e, index) => {
            if (index == 0) l.Date = element[e];

            if (index > 0) {
                l.Name =  e;
                if(e== 'Ci Collective Investments (RF) Prop Ltd'){
                    l.Value = element[e];
                }
                l.Value = element[e];
               if(l.Value) d.push({...l});
            }
            
        });
    });
    data.payload = d;
    return callback(null, data);
}

module.exports = {
    transform,
    transform1
}