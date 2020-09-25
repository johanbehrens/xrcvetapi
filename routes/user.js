var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var fetch = require('node-fetch');
var { GetAllFriendIds } = require('../helpers/user');
var { register, login, getHorses } = require('../helpers/parkrides');

router.get('/', GetUser);
router.get('/all', GetAllUsers);
router.post('/', UpdateUser);
router.post('/linkParkRides', LinkParkRides);
router.post('/getParkRideHorses', GetParkRideHorses);

function GetUser(req, res) {
    var db = getDb();
    db.collection('users').findOne({ _id: req.user._id }, function (err, user) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            let response = { valid: false };
            if (user.currentSubscription) {
                var today = new Date();
                response.valid = user.currentSubscription.expires_date > today;
            }
            res.send(response);
        }
    });
}

function LinkParkRides(req, res) {
    register(req.user._id, req.body.riderId, req.body.username, req.body.password, done);
    function done(err) {
        if (err) {
            res.status(500);
            return res.json({
                message: err.message,
                error: err
            });
        }
        else {
            res.send({ message: 'done' });
        }
    }
}

function GetParkRideHorses(req, res) {
    login(req.body.username, done);
    function done(err) {
        if (err) {
            res.status(500);
            return res.json({
                message: err.message,
                error: err
            });
        }
        else {
            getHorses(gotHorses);
            function gotHorses(err, horses) {
                if (err) {
                    res.status(500);
                    return res.json({
                        message: err.message,
                        error: err
                    });
                }
                return res.send(horses);
            }
        }
    }
}

function GetAllUsers(req, res) {
    console.log('GetAllUsers');
    console.log(req.query);
    if (!req.query.skip) req.query.skip = 0;
    if (!req.query.limit) req.query.limit = 0;
    var db = getDb();

    return GetAllFriendIds(req.user._id, doGetAllUsersNotFriends);

    function doGetAllUsersNotFriends(userIds) {
        return db.collection('rider')
            .aggregate(getAggregate(userIds, req.query.filter, parseInt(req.query.skip), parseInt(req.query.limit)))
            .toArray(function (err, users) {
                console.log(users)
                if (err) {
                    res.status(500);
                    return res.json({
                        message: err.message,
                        error: err
                    });
                }
                else return res.send({ skip: parseInt(req.query.skip) + parseInt(req.query.limit), users });
            });
    };

}

function UpdateUser(req, res) {
    var db = getDb();

    db.collection('users').updateOne({ _id: req.user._id }, { $set: { firebaseToken: req.body.firebaseToken, lastLogin: new Date(), logins: req.user.logins ? 1 : req.user.logins + 1 } }, function (err, user) {
        if (err) {
            console.log(err);
        }
        res.send(user);
    });
}

function getAggregate(userIds, filter, skip, limit) {
    let name = {
        $match: { userId: { $nin: userIds } }
    };
    if (filter) {
        name = {
            $match: {
                name: { $regex: filter, $options: 'i' },
                userId: { $nin: userIds }
            }
        };

    }
    let t = [
        {
            $match: {
                default: true
            }
        },
        {
            $lookup: {
                "from": "users",
                "localField": "userId",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {
            $unwind: {
                path: "$user"
            }
        },
        {
            $project: {
                name: { $concat: ["$name", " ", "$surname"] },
                userId: "$user._id",
                email: "$user.emailaddress",
                imageId: "$imageId"
            }
        },
        name,
        {
            $sort: {
                name: 1
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ];
    return t;
}

module.exports = router;