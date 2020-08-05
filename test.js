
const sites = require('./helpers/sites');

sites.getResults('ERASA',435, done);

function done(err, d){
    console.log(err);
    console.log(d);
    

}
