var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var fetch = require('node-fetch');

router.get('/', GetUser);
router.post('/', UpdateUser);

function GetUser(req, res) {
    var db = getDb();
    db.collection('users').findOne({_id: req.user._id}, function(err, user){
        if(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
                });
        }
        else {
            let response = {valid: false};
            if(user.currentSubscription) {
                var today = new Date();
                response.valid = user.currentSubscription.expires_date > today;
            }
            res.send(response);
        }
    });
}

function UpdateUser(req, res) {
    var db = getDb();

    db.collection('users').updateOne({_id: req.user._id},{$set:{firebaseToken: req.body.firebaseToken, lastLogin: new Date(), logins: req.user.logins ? 1: req.user.logins+1}}, function(err, user){
        if(err) {
            console.log(err);
        }
        res.send(user);
    });
}

module.exports = router;