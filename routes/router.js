const config = require("../config/database");
const getDb = require("../db").getDb;
var fetch = require('node-fetch');
var crypto = require('crypto');
var ObjectID = require('mongodb').ObjectID;
var { DoFriendInvite } = require('../helpers/user');
var { TemplateEmail } = require('../helpers/email');

module.exports = (function () {
    'use strict';
    var router = require('express').Router();
    var jwt = require('jwt-simple');

    router.get('/', function (req, res) {
        res.json({ 'foo': 'bar' });
    });

    router.post('/upload', function (req, res) {
        if (req.body.files) {
            var db = getDb();
            db.collection('profilepicture').insertOne({ image: req.body.files }, function (err, image) {
                res.send(image.ops[0]._id);
            })
        }

        else return res.json({ 'foo': 'bar' });
    });

    router.post('/login', Login);
    router.post('/register', Register);

    router.get('/requestToken/:name', function (req, res) {
        if (req.params.name) {
            var db = getDb();
            db.collection('keys').insertOne({ name: req.params.name, active: false }, function (err, doc) {
                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else {
                    var token = jwt.encode({ "name": req.params.name }, config.secret);
                    res.json({ success: true, token: 'JWT ' + token });
                }
            });
        }
        else return res.json({ 'error': 'Invalid name' });
    });

    function ImportUser(username, callback) {
        fetch('https://www.xrc.co.za/m/api_getUser.php', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({ username })
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (user) {
                if (user.error) {
                    return callback(user.error);
                }
                else {
                    user.rank = getRank(user.usertypeid);
                    return callback(null, user);
                }
            }).catch(function (err) {
                return callback(err);
            });
    }

    function Authenticate(user, password, req, res) {
        if (user.isActive == 0) {
            let t = { error: 'Account Not Activated' };
            return res.send(t);
        }
        if (user.isApproved == 0) {
            let t = { error: 'Account Not Approved' };
            return res.send(t);
        }

        var password = user.salt + crypto.createHash('sha256').update(password).digest('hex');
        var hash = crypto.createHash('sha256').update(password).digest('hex');

        if (hash == user.password) {
            var toSend = {
                username: user.username.toLowerCase(),
                valid: true,
                userid: user._id,
                clubcode: user.clubcode,
                usertypeid: user.usertypeid,
                owner: user.owner,
                isLinked: user.isLinked,
                rank: user.rank,
                erasa_code: user.erasa_code
            }
            return sendToken(toSend, res, req.body.isWeb)
        }

        let t = { error: 'Wrong Username or Password' };
        return res.send(t);
    }

    function sendToken(user, res, isWeb, appleId) {
        var token = jwt.encode({ "id": user.username }, config.secret);
        var response = {
            token: 'JWT ' + token,
            ...user,
            rank: getRank(user.usertypeid),
        };

        var set = { lastLogin: new Date() };
        if (isWeb) set = { lastWebLogin: new Date() };
        if (appleId) set = { appleId };

        var db = getDb();
        db.collection('users').updateOne({ username: user.username }, { $set: set }, function (err, user) {
            if (err) {
                console.log(err);
                return res.send(response);
            }
            else return res.send(response);
        });
    }

    function Register(req, res) {
        if (req.body && !req.body.name) return res.json({ 'error': 'Name required' });
        if (req.body && !req.body.surname) return res.json({ 'error': 'Surname required' });
        if (req.body && !req.body.username) return res.json({ 'error': 'Email required' });
        if (!validateEmail(req.body.username)) return res.json({ 'error': 'Email is invalid' });
        if (req.body && !req.body.password) return res.json({ 'error': 'Password required' });
        if (req.body && !req.body.confirmPassword) return res.json({ 'error': 'Confirm password' });
        if (req.body && !(req.body.confirmPassword === req.body.password)) return res.json({ 'error': 'Password must match' });

        var db = getDb();
        db.collection('users').findOne({ username: req.body.username.toLowerCase() }, function (err, user) {
            if (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            }
            if (user) {
                return res.json({ 'error': 'User already exists' });
            }
            else {
                req.body.salt = 'abc';
                var password = req.body.salt + crypto.createHash('sha256').update(req.body.password).digest('hex');
                var hash = crypto.createHash('sha256').update(password).digest('hex');

                delete req.body.confirmPassword;
                req.body.emailaddress = req.body.username.toLowerCase();
                req.body.password = hash;
                req.body.clubcode = req.body.club;
                req.body.erasa_code = req.body.code;

                delete req.body.club;
                delete req.body.code;

                let user = {
                    ...req.body,
                    isActive: '0',
                    isApproved: '1',
                    rank: getRank('2'),
                    usertypeid: '2'
                };

                db.collection('users').insertOne(user, function (err, newUser) {
                    if (err) {
                        res.status(500);
                        return res.json({
                            message: err.message,
                            error: err
                        });
                    }

                    CheckFriendRequest(req.body.emailaddress.toLowerCase(), newUser.ops[0]._id, doAuth);
                    function doAuth() {
                        db.collection('rider').insertOne({ default: true, name: req.body.name, surname: req.body.surname, userId: newUser.ops[0]._id }, function (err, rider) {

                            TemplateEmail(req.body.emailaddress, 'register');
                            TemplateEmail('behrens.johan@gmail.com', 'register');

                            return sendToken(user, res, user.isWeb);
                        });
                    }
                });
            }
        });
    }

    function getRank(usertypeid) {
        switch (usertypeid) {
            case "1":
                return 50
            case "2":
                return 8
            case "3":
                return 10
            case "5":
                return 0
            case "6":
                return 8
            case "7":
                return 40
            case "8":
                return 9
            default:
                return 0;
        }
    }

    function validateEmail(email) {
        if(email === 'iosTest') return true;
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    function getAppleUser(token, req, res) {
        console.log(req.body);

        let match = {}

        if (req.body.appleEmail) {
            match = { emailaddress: req.body.appleEmail };
            console.log('Apple first login: ', req.body.appleEmail)
        }
        else {
            match = { appleId: token };
        }

        var db = getDb();
        db.collection('users').findOne(match, function (err, user) {
            if (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            }
            if (user) {
                return sendToken(user, res, null, token);
            }
            else { //get user from xrc
                ImportUser(req.body.appleEmail, function (err, user) {
                    if (err) {
                        if (err) {
                            res.status(500);
                            res.json({
                                message: err.message,
                                error: err
                            });
                        }
                    }

                    if (user) {
                        user.appleId = token;
                        db.collection('users').insertOne(user, function (err, newUser) {
                            if (err) {
                                res.status(500);
                                res.json({
                                    message: err.message,
                                    error: err
                                });
                            }

                            CheckFriendRequest(req.body.appleEmail, newUser.ops[0]._id, doAuth);
                            function doAuth() {
                                db.collection('rider').insertOne({ default: true, name: user.name, surname: user.surname, userId: newUser.ops[0]._id }, function (err, rider) {
                                    return sendToken(user, res);
                                });
                            }
                        });
                    }
                    else {
                        let user = {
                            name: '',
                            username: req.body.appleEmail,
                            emailaddress: req.body.appleEmail,
                            appleId: token,
                            isActive: 1
                        };
                        db.collection('users').insertOne(user, function (err, newUser) {
                            if (err) {
                                res.status(500);
                                res.json({
                                    message: err.message,
                                    error: err
                                });
                            }
                            CheckFriendRequest(user.emailaddress, newUser.ops[0]._id, doAuth);
                            function doAuth() {
                                db.collection('rider').insertOne({ default: true, name: user.name, surname: user.surname, userId: newUser.ops[0]._id }, function (err, rider) {
                                    return sendToken(user, res);
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    function getFacebookUser(token, req, res) {
        fetch("https://graph.facebook.com/v2.5/me?fields=id,name,email,first_name,last_name&access_token=" + token, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "GET"
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (user) {
                let fbid = user.id;                 // To Get Facebook ID
                let fbfullname = user.name; // To Get Facebook full name
                let femail = user.email;    // To Get Facebook email ID
                let fname = user.first_name;    // To Get Facebook email ID
                let flastname = user.last_name;

                var db = getDb();
                db.collection('users').findOne({ username: femail }, function (err, user) {
                    if (err) {
                        res.status(500);
                        res.json({
                            message: err.message,
                            error: err
                        });
                    }
                    if (user) {
                        return sendToken(user, res);
                    }
                    else { //get user from xrc
                        ImportUser(femail, function (err, user) {
                            if (err) {
                                if (err) {
                                    res.status(500);
                                    res.json({
                                        message: err.message,
                                        error: err
                                    });
                                }
                            }

                            if (user) {
                                db.collection('users').insertOne(user, function (err, newUser) {
                                    if (err) {
                                        res.status(500);
                                        res.json({
                                            message: err.message,
                                            error: err
                                        });
                                    }

                                    CheckFriendRequest(req.body.username, newUser.ops[0]._id, doAuth);
                                    function doAuth() {
                                        db.collection('rider').insertOne({ default: true, name: user.name, surname: user.surname, userId: newUser.ops[0]._id }, function (err, rider) {
                                            return sendToken(user, res);
                                        });
                                    }
                                });
                            }
                            else {
                                let user = {
                                    name: fname,
                                    surname: flastname,
                                    username: femail,
                                    emailaddress: femail,
                                    Fuid: fbid,
                                    Funame: fbfullname,
                                    Ffname: fbfullname,
                                    Femail: femail,
                                    isActive: 1
                                };
                                db.collection('users').insertOne(user, function (err, newUser) {
                                    if (err) {
                                        res.status(500);
                                        res.json({
                                            message: err.message,
                                            error: err
                                        });
                                    }
                                    CheckFriendRequest(user.emailaddress, newUser.ops[0]._id, doAuth);
                                    function doAuth() {
                                        db.collection('rider').insertOne({ default: true, name: user.name, surname: user.surname, userId: newUser.ops[0]._id }, function (err, rider) {
                                            return sendToken(user, res);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }).catch(function (err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                });
            });
    }

    function Login(req, res) {
        if (req.body && req.body.isReset && !req.body.token) {
            var code = Math.round(Math.random() * 10000);
            var db = getDb();
            return db.collection('users').findOne({ username: req.body.username }, function (err, user) {
                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else if (user) {
                    return db.collection('resetTokens').insertOne({ email: req.body.username, code }, function (err, rider) {
                        TemplateEmail(req.body.username, 'resetToken', { code });
                        return res.json({ 'error': 'Link Sent' });
                    });
                }
                else return res.json({ 'error': 'Email not registered' });
            });
        }
        else if (req.body && req.body.isReset && req.body.token) {
            if (req.body && !req.body.password) return res.json({ 'error': 'Password required' });
            if (req.body && !req.body.confirmPassword) return res.json({ 'error': 'Confirm password' });
            if (req.body && !(req.body.confirmPassword === req.body.password)) return res.json({ 'error': 'Passwords must match' });

            var db = getDb();
            return db.collection('resetTokens').findOne({ email: req.body.username, code: parseInt(req.body.token) }, function (err, resetPair) {
                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else if (resetPair) {
                    return db.collection('users').findOne({ username: req.body.username }, function (err, user) {
                        if (err) {
                            res.status(500);
                            res.json({
                                message: err.message,
                                error: err
                            });
                        }
                        else if (user) {
                            var password = user.salt + crypto.createHash('sha256').update(req.body.password).digest('hex');
                            var hash = crypto.createHash('sha256').update(password).digest('hex');

                            return db.collection('users').updateOne(
                                { _id: user._id },
                                {
                                    $set: {
                                        password: hash
                                    }
                                }, function (err, d) {
                                    return db.collection('resetTokens').deleteMany({ email: req.body.username }, function (err) {
                                        user.password = hash;
                                        return Authenticate(user, req.body.password, req, res);
                                    });
                                });
                        }
                        else return res.json({ 'error': 'Email not registered' });
                    });
                }
                else return res.json({ 'error': 'Token not found' });
            });
        }
        else if (req.body && req.body.appleToken) {
            getAppleUser(req.body.appleToken, req, res);
        }
        else if (req.body && req.body.ftoken) {
            getFacebookUser(req.body.ftoken, req, res);
        }
        else if (req.body && !req.body.username) {
            return res.json({ 'error': 'Please enter a username' });
        }
        else if (req.body && !req.body.password) {
            return res.json({ 'error': 'Please enter a password' });
        }
        else if (!validateEmail(req.body.username)) {
            return res.json({ 'error': 'You have entered an invalid email address' });
        }
        else if (req.body && req.body.username && req.body.password) {

            var db = getDb();
            db.collection('users').findOne({ username: req.body.username.toLowerCase() }, function (err, user) {
                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else {
                    if (!user) { //User does not exists 
                        //Does User exist on www.xrc.co.za?
                        ImportUser(req.body.username.toLowerCase(), function (err, user) {
                            if (err) {
                                res.status(500);
                                res.json({
                                    message: err.message,
                                    error: err
                                });
                                return;
                            }
                            if (user) {
                                db.collection('users').insertOne(user, function (err, newUser) {
                                    if (err) {
                                        res.status(500);
                                        res.json({
                                            message: err.message,
                                            error: err
                                        });
                                    }
                                    CheckFriendRequest(req.body.username.toLowerCase(), newUser.ops[0]._id, doAuth);
                                    function doAuth() {
                                        db.collection('rider').insertOne({ default: true, name: user.name, surname: user.surname, userId: newUser.ops[0]._id }, function (err, rider) {
                                            Authenticate(user, req.body.password, req, res);
                                        })
                                    }
                                });
                            }
                            else res.json({ 'error': 'Wrong Username or Password: 2' });
                        });
                    }
                    else {
                        Authenticate(user, req.body.password, req, res);
                    }
                }
            });
        }
        else return res.json({ 'error': 'Wrong Username or Password: 1' });
    }

    function CheckFriendRequest(email, userId, callback) {
        var db = getDb();
        db.collection('friends').findOne({ email }, function (err, found) {
            if (found) {
                DoFriendInvite(found.userId, userId, removeFromFriends);
            }
            else callback();

            function removeFromFriends() {
                db.collection('friends').deleteOne({ _id: found._id }, function (err, result) {
                    return callback();
                });
            }
        });
    }

    return router;
})();