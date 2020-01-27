var ping = require('ping');
var schedule = require('node-schedule');
const getDb = require("../db").getDb;
const initDb = require("../db").initDb;
var { enqueue } = require('../helpers/jobqueue');
var ObjectID = require('mongodb').ObjectID;

var cfg = {
    timeout: 10,
    extra: ["-i 2"],
};

var users = [{
    token: '5cb967737ff245517c5a7165',
    name: 'Johan'
}, {
    token: '5cbb0ed05d1ddc6311e0c588',
    name: 'Elardus'
}];

schedule.scheduleJob("* */30 * * * *", function () {
    initDb({}, function () {
        var db = getDb();
        db.collection('elmicom').find({ IPWAN: { $exists: true } }).sort().toArray(function (err, docs) {
            if (err) {
                console.log(err);
                return;
            }

            docs.forEach(function (host) {
                ping.sys.probe(host.IPWAN, function (isAlive) {
                    if (isAlive) {
                        console.log('host ' + host.meterId + ' is alive');
                    }
                    else {
                        console.log('host ' + host.meterId + ' is dead');
                        users.forEach(function (user) {
                            sendPush(new ObjectID(user.token), host.meterId, 'Connection', 'Down');
                        });
                    }
                }, cfg);
            });
        });
    });
});
console.log('Elmicom Scheduler started');

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
function update() { }
