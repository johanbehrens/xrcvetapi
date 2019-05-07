const { enqueue } = require('./helpers/jobqueue');
var ObjectID = require('mongodb').ObjectID;

const notification = {
    userId: ObjectID('5cc9ff51c96433c8d750d27c'),
    title: 'Some Title',
    message: `Some message`,
    body: `${req.user.name}  is now your friend`,
    scheduledDate: new Date()
};

enqueue.sendPushNotification(notification, done);

function done() {
    console.log('done');
}