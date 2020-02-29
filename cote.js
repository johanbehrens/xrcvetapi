const cote = require('cote');
 
//const responder = new cote.Responder({ name: 'currency conversion responder', key: 'conversion' });
const responder = new cote.Responder({ name: 'Main Server' });
 

responder.on('time',(req, cb) => {
    cb(null, 'return text');
});
 
