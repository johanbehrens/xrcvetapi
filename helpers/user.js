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
function GetAllFriendIds(userId, callback) {
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
        }
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

function GetHistory(userId, callback) {
    var db = getDb();
    GetUserIds(userId, doGetLocations);

    function doGetLocations(userIds) {
        console.log('GetLocations');
        db.collection('location').aggregate(locationAggregate(userIds)).toArray(function (err, location) {
            console.log('return GetLocations');
            if (err) {
                return callback(err);
            }
            else {
                location.map(l => {
                    l.edit = false;
                    l.own = false;
                    if (l.userId.toString() == userId.toString()) {
                        l.own = true;
                        l.edit = true;
                    }
                });
                return callback(null, location);
            }
        });
    }
}

function locationAggregate(Ids) {
    let t = [{
        $match: {
            userId: { $in: Ids }
        }
    },
    {
        $project: { locationRideId: 1, userId: 1, username: 1, horseId: 1, riderId: 1, raceId: 1, riderNumber: 1, date: 1, start: 1, end: 1, imageId: 1, trackId: 1 }
    },
    {
        $lookup: {
            "from": "rider",
            "localField": "riderId",
            "foreignField": "_id",
            "as": "rider"
        }
    },
    {
        $unwind: {
            path: "$rider"
        }
    },
    {
        $lookup: {
            "from": "horse",
            "localField": "horseId",
            "foreignField": "_id",
            "as": "horse"
        }
    },
    {
        $unwind: {
            path: "$horse"
        }
    },
    {
        $project: {
            locationRideId: 1, userId: 1, username: 1, horseId: 1, riderId: 1, raceId: 1, riderNumber: 1, date: 1, start: 1, end: 1,
            name: "$rider.name", surname: "$rider.surname", riderImageId: "$rider.imageId",
            hname: "$horse.name", horseImageId: "$horse.imageId",
            type: "PERSONAL",
            imageId: 1, trackId: 1
        }
    },
    {
        $sort: {
            date: -1
        }
    }
    ];
    console.log(t);
    return t;
}

module.exports = {
    GetUserIds,
    DoFriendInvite,
    GetAllFriendIds,
    GetHistory
}