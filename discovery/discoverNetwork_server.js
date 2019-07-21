const cote = require('cote');
const timeService = new cote.Responder({ name: 'Next Service' });

timeService.on('time', (req, cb) => {
  console.log(req);
    cb(new Date());
});
//https://github.com/dashersw/cote
