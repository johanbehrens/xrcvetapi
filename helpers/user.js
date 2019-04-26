const getDb = require("../db").getDb;

function GetUserIds(userId, callback) {
    var db = getDb();
    db.collection('users').aggregate([
        {
            $match: {
                _id: userId
            }
        },
        {
            $unwind: {
                path: "$friends"
            }
        },
        {
            $project: {
                "friends": "$friends"
            }
        },
        {
            $match: {
                "friends.accepted": true
            }
        },
    ]).toArray(function (err, doc) {
        let ids = doc.map(u => u.friends.userId);
        ids.push(userId);
        callback(ids);
    });
}

function DoFriendInvite(userId, friendId, callback) {
    var db = getDb();
    db.collection('users').updateOne(
        { _id: userId },
        {
            $push: {
                friends: {
                    userId: friendId,
                    requested: true,
                    accepted: false
                }
            }
        }, function (err, l) {
            db.collection('users').updateOne(
                { _id: friendId },
                {
                    $push: {
                        friends: {
                            userId: userId,
                            pending: true,
                            accepted: false
                        }
                    }
                }, function (err, l) {
                    callback();
                });
        });
}

module.exports = {
    GetUserIds,
    DoFriendInvite
}