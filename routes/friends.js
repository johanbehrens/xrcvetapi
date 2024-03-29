var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
var { DoFriendInvite } = require('../helpers/user');
var { enqueue } = require('../helpers/jobqueue');
var { TemplateEmail } = require('../helpers/email');

router.post('/', InviteFriend);
router.get('/', GetFriends);
router.post('/:id', AcceptFriend);
router.post('/unreg/:id', RemoveUnregFriend);

function RemoveUnregFriend(req, res) {
    var db = getDb();
    console.log('RemoveUnregFriend:' + req.params.id);
    db.collection('friends').deleteOne({ _id: ObjectID(req.params.id) }, function (err, result) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else res.send(result);
    });
}

function GetFriends(req, res) {
    var db = getDb();
    console.log('GetFriends');

    db.collection('users').aggregate([
        {
            $match: {
                _id: req.user._id
            }
        },
        {
            $unwind: {
                path: "$friends"
            }
        },
        {
            $lookup: {
                "from": "users",
                "localField": "friends.userId",
                "foreignField": "_id",
                "as": "userFriends"
            }
        },
        {
            $unwind: {
                path: "$userFriends"
            }
        },
        {
            $project: {
                "friendId": "$userFriends._id",
                "name": "$userFriends.name",
                "surname": "$userFriends.surname",
                "requested": "$friends.requested",
                "pending": "$friends.pending",
                "accepted": "$friends.accepted"
            }
        },

    ]).toArray(function (err, friends) {
        console.log('return GetFriends');
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            db.collection('friends').find({ userId: req.user._id }).toArray(function (err, unregisterdFriends) {
                if (unregisterdFriends) {
                    unregisterdFriends.map(f => {
                        friends.push({ _id: f._id, email: f.email, requested: true, unreg: true });
                    });
                }
                res.send(friends);
            });
        }
    });
}

function InviteFriend(req, res) {
    var db = getDb();

    db.collection('users').findOne({ emailaddress: req.body.email.toLowerCase() }, function (err, found) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            //TODO
            //has already invited
            if (!found) {
                let friend = {
                    userId: req.user._id,
                    email: req.body.email.toLowerCase()
                }
                db.collection('friends').findOne({ userId: req.user._id, email: req.body.email.toLowerCase() }, function (err, found) {
                    if (!found) {
                        db.collection('friends').insertOne(friend, function (err, friend) {
                            TemplateEmail(req.body.email.toLowerCase(), 'friendrequest', {name: req.user.name + ' ' + req.user.surname});
                            return res.send({ message: 'New Invite has been sent' });
                        })
                    }
                    else return res.send({ message: 'Invite has already been sent' });
                });
            }
            else {
                db.collection('users').findOne({ _id: req.user._id, 'friends.userId': found._id }, function (err, added) {
                    if (added) {
                        return res.send({ message: 'Invite has already been sent' });
                    }
                    else {

                        const notification = {
                            userId: found._id,
                            title: 'Friend Request',
                            message: `${req.user.name} wants to be your friend`,
                            body: `${req.user.name} wants to be your friend`,
                            scheduledDate: new Date()
                        };

                        enqueue.sendPushNotification(notification, done);

                        function done() {
                            DoFriendInvite(req.user._id, found._id, doReturn);
                            function doReturn() {
                                res.send({ message: 'New Invite has been sent' });
                            }
                        }
                    }
                });
            }
        }

    });
}

function AcceptFriend(req, res) {
    if (!!req.body.accepted) {
        const notification = {
            userId: ObjectID(req.params.id),
            title: 'Friend Request Accepted',
            message: `${req.user.name}  is now your friend`,
            body: `${req.user.name}  is now your friend`,
            scheduledDate: new Date()
        };

        enqueue.sendPushNotification(notification, done);
        function done() {
            acceptFriend(req.user._id, ObjectID(req.params.id), finished);
        }
    }
    else deleteFriend(req.user._id, ObjectID(req.params.id), finished);

    function finished() {
        res.send({ done: "done" });
    }
}

function deleteFriend(userId, friendId, callback, done) {
    var db = getDb();

    db.collection('users').findOne({ _id: userId }, function (err, user) {
        user.friends = user.friends.filter(f => f.userId.toString() != friendId.toString());

        db.collection('users').replaceOne({ _id: userId }, user, function (err, u) {
            if (done) callback(u);
            else deleteFriend(friendId, userId, callback, true);
        });
    });
}

function acceptFriend(userId, friendId, callback, done) {
    var db = getDb();

    db.collection('users').findOne({ _id: userId }, function (err, user) {
        user.friends.map(f => {
            if (f.userId.toString() == friendId.toString())
                f.accepted = true;
        });
        db.collection('users').replaceOne({ _id: userId }, user, function (err, u) {
            if (done) callback(u);
            else acceptFriend(friendId, userId, callback, true);
        });
    });
}

module.exports = router;