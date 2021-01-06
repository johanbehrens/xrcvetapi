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
}, {
    token: '5e34f845b883f109838a5af6',
    name: 'Jarryd'
}];

schedule.scheduleJob("0 */30 * * * *", function () {
    initDb({}, function () {
        var db = getDb();
        db.collection('elmicom').find({ IPWAN: { $exists: true } }).sort().toArray(function (err, docs) {
            if (err) {
                console.log(err);
                return;
            }

            docs.forEach(function (host) {
                ping.sys.probe(host.IPWAN.split('/')[0], function (isAlive) {
                    if (isAlive) {
                        console.log('host ' + host.meterId + ' is alive');
                        
                        db.collection('elmicom').updateOne(
                            { meterId: host.meterId },
                            {
                                $set: {
                                    ...host,
                                    date: new Date(),
                                    wan: 'up'
                                }
                            },
                            { upsert: true }, function (err, result) {
                                console.log(host.meterId, result.modifiedCount);
                                if (err) {
                                    console.log(err);
                                }
                                else{
                                    if (host.wan == 'down') {
                                        users.forEach(function (user) {
                                            sendPush(new ObjectID(user.token), host.meterId, 'WAN Connection', 'UP');
                                        });
                                    }
                                }
                            });
                    }
                    else {
                        console.log('host ' + host.meterId + ' is dead');
                       
                        db.collection('elmicom').updateOne(
                            { meterId: host.meterId },
                            {
                                $set: {
                                    ...host,
                                    date: new Date(),
                                    wan: 'down'
                                }
                            },
                            { upsert: true }, function (err, result) {
                                console.log(host.meterId, result.modifiedCount);
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    if (host.wan == 'up') {
                                        users.forEach(function (user) {
                                            sendPush(new ObjectID(user.token), host.meterId, 'WAN Connection', 'Down');
                                        });
                                    }
                                }
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
