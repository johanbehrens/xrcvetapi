const config = require("../config/database");
const getDb = require("../db").getDb;
var fetch = require('node-fetch');
var crypto = require('crypto');
var ObjectID = require('mongodb').ObjectID;

module.exports = (function() {
    'use strict';
    var router = require('express').Router();
    var jwt = require('jwt-simple');

    router.get('/', function(req, res) {
        res.json({'foo':'bar'});
    });

    router.post('/upload', function(req, res) {
        if(req.body.files) {
            var db = getDb();
            db.collection('profilepicture').insertOne({image: req.body.files}, function(err, image){
                res.send(image.ops[0]._id);
            })
        }
        
       else return res.json({'foo':'bar'});
    });

    router.post('/login', Login);
    router.post('/register', Register);

    router.get('/requestToken/:name', function(req, res) {
        if(req.params.name)
        {
            var db = getDb();
            db.collection('keys').insertOne({name:req.params.name, active:false}, function(err, doc){
                if(err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                        });
                }
                else {
                    var token = jwt.encode({"name":req.params.name}, config.secret);
                    res.json({success: true, token: 'JWT ' + token});
                }
            });
        }
        else return res.json({'error':'Invalid name'});
    });

    function ImportUser(username, callback) {
        fetch('https://www.xrc.co.za/m/api_getUser.php', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({username})
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(user) {
            if(user.error) {
                return callback(user.error);
            }
            else {
                return callback(null, user);
            }
        }).catch(function(err) {
            return callback(err);
        });
    }

    function Authenticate(user, password, req, res){
        if(user.isActive == 0) {
            let t = { error: 'Account Not Activated'};	
            return res.send(t);
        }
        if(user.isApproved == 0) {
            let t = { error: 'Account Not Approved'};	
            return res.send(t);
        }

        var password = user.salt+crypto.createHash('sha256').update(password).digest('hex');
        var hash = crypto.createHash('sha256').update(password).digest('hex');

        if(hash == user.password){
            var token = jwt.encode({"id":user.username}, config.secret);
            var response = {
                token: 'JWT ' + token,
                username: user.username
            };
            
            return res.send(response);
        }
        
        let t = { error: 'Wrong Username or Password'};	
        return res.send(t);
    }

    function Register(req, res) {

        if(req.body && !req.body.username) return res.json({'error':'Email required'});
        if(req.body && !req.body.password) return res.json({'error':'Password required'});
        if(req.body && !req.body.confirmPassword) return res.json({'error':'Confirm password'});
        if(req.body && !(req.body.confirmPassword === req.body.password)) return res.json({'error':'Password must match'});
        var db = getDb();
        db.collection('users').findOne({username: req.body.username}, function(err, user){
            if(err) {
                res.status(500);
                res.json({
                    message: err.message,
                    error: err
                    });
            }
            if(user) {
                return res.json({'error':'User exists'});
            }
        else {
            req.body.salt = 'abc';
            var password = req.body.salt+crypto.createHash('sha256').update(req.body.password).digest('hex');
            var hash = crypto.createHash('sha256').update(password).digest('hex');

            delete req.body.confirmPassword;
            req.body.emailaddress = req.body.username;
            req.body.password = hash;
                db.collection('users').insertOne(req.body, function(err, doc){
                if(err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                        });
                }
                else {
                    var token = jwt.encode({"id":req.body.emailaddress}, config.secret);
                    var response = {
                        token: 'JWT ' + token,
                        username: req.body.emailaddress
                    };
                    
                    return res.send(response);
                }
                });
            }
        });
    }

    function getFacebookUser(token,req, res) {
        fetch("https://graph.facebook.com/v2.5/me?fields=id,name,email,first_name,last_name&access_token="+token, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "GET"
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(user) {
            let fbid = user.id;                 // To Get Facebook ID
            let fbfullname = user.name; // To Get Facebook full name
            let femail = user.email;    // To Get Facebook email ID
            let fname = user.first_name;    // To Get Facebook email ID
            let flastname = user.last_name; 

            var db = getDb();
            db.collection('users').findOne({username: femail}, function(err, user){
                if(err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                        });
                }
                if(user){
                    var token = jwt.encode({"id":user.username}, config.secret);
                    var response = {
                        token: 'JWT ' + token,
                        username: user.username
                    };
                    
                    return res.send(response);
                }
                else { //get user from xrc
                    ImportUser(femail, function(err, user){
                        if(user) {
                            db.collection('users').insertOne(user, function(err, doc){
                                if(err) {
                                    res.status(500);
                                    res.json({
                                        message: err.message,
                                        error: err
                                        });
                                }
                                else {
                                    var token = jwt.encode({"id":user.username}, config.secret);
                                    var response = {
                                        token: 'JWT ' + token,
                                        username: user.username
                                    };
                                    
                                    return res.send(response);
                                }
                            });
                        }
                        else {
                            let user = {
                                name: fname,
                                surname: flastname,
                                username:  femail,
                                emailaddress : femail,
                                Fuid: fbid,
                                Funame: fbfullname,
                                Ffname: fbfullname,
                                Femail: femail,
                                isActive: 1
                            };
                            db.collection('users').insertOne(user, function(err, doc){
                                if(err) {
                                    res.status(500);
                                    res.json({
                                        message: err.message,
                                        error: err
                                        });
                                }
                                else {
                                    var token = jwt.encode({"id":user.username}, config.secret);
                                    var response = {
                                        token: 'JWT ' + token,
                                        username: user.username
                                    };
                                    
                                    return res.send(response);
                                }
                            });
                        }
                    });
                }
            });


        }).catch(function(err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        });

    }

    function Login(req, res) {
        if(req.body && req.body.ftoken) {
            getFacebookUser(req.body.ftoken,req, res);
        }
        else if(req.body && req.body.username && req.body.password)
        {
            var db = getDb();
            db.collection('users').findOne({username: req.body.username}, function(err, user){
                if(err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                        });
                }
                else { 
                    if(!user) { //User exists 
                        ImportUser(req.body.username, function(err, user){
                            if(err){
                                res.status(500);
                                res.json({
                                    message: err.message,
                                    error: err
                                    });
                                return ;
                            }
                            if(user) {
                                db.collection('users').insertOne(user, function(err, doc){
                                    if(err) {
                                        res.status(500);
                                        res.json({
                                            message: err.message,
                                            error: err
                                            });
                                    }
                                    Authenticate(user, req.body.password, req, res);
                                });
                            }
                            else res.json({'error':'Wrong Username or Password: 2'});
                        });
                    }
                    else { //Does User exist on www.xrc.co.za
                        Authenticate(user, req.body.password, req, res);
                    }
                }
            });            
        }
        else return res.json({'error':'Wrong Username or Password: 1'});
    }

    return router;
})();