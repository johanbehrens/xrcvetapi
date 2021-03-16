admin = require('firebase-admin');
const getDb = require("../db").getDb;

var serviceAccount = require("./xrc-tracker-1553667749489-firebase-adminsdk-vb6vs-448ba1e226.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

function SendNotification({userId, title, body}, callback) {
    var db = getDb();
    var payload = {
        notification: {
            title,
            body
        }
    };

    db.collection('users').findOne({ _id: userId }, function (err, user) {
        if(err) return callback(err);
        if (user) {
            admin.messaging().sendToDevice(user.firebaseToken, payload)
                .then((response) => {
                    console.log('Successfully sent message:', response);
                    if(response && response.results && response.results[0]) {
                        console.log(response.results[0].error);
                    }
                    
                    return callback();
                })
                .catch((error) => {
                    console.log('Error sending message:');
                    console.log(error);
                    return callback(error);
                });
        }
        else {
            return callback({message:'No user was found'});
        }
    });
}

function send(notification, callback) {
    console.log(notification);
    console.log('sent:'+notification);
    return callback();
}

module.exports = {
    SendNotification,
    send
}