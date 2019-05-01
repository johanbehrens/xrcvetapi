admin = require('firebase-admin');
const getDb = require("../db").getDb;

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

function SendNotification(userId, title, body) {
    var db = getDb();
    var payload = {
        notification: {
            title,
            body
        }
    };

    db.collection('users').findOne({ _id: userId }, function (err, user) {
        if (user) {
            admin.messaging().sendToDevice(user.firebaseToken, payload)
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                });
        }
    });
}

module.exports = {
    SendNotification
}