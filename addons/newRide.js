const getDb = require("../db").getDb;
const initDb = require("../db").initDb;
var { enqueue } = require('../helpers/jobqueue');

initDb({}, function () {
    var db = getDb();
    db.collection('users').find({ firebaseToken: { $exists: true } }).toArray(function (err, docs) {
        if (err) {
            console.log(err);
            return;
        }

       docs.forEach(user => {
            console.log(user.username);
            sendPush(user._id, 'Oudtshoorn Endurance Ride', 'Enter Online NOW', 'Closing Soon!!');
        });
    });
});

function sendPush(id, meterId, type, status) {
  
    notification = {
        userId: id,
        title: meterId,
        message: `${type} ${status}`,
        body: `${type} ${status}`,
        scheduledDate: new Date()
    };

    enqueue.sendPushNotification(notification, update);
    
}
function update() { 
console.log('done');
}
