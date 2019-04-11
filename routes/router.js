const config = require("../config/database");
const getDb = require("../db").getDb;
var fetch = require('node-fetch');
var crypto = require('crypto');

module.exports = (function() {
    'use strict';
    var router = require('express').Router();
    var jwt = require('jwt-simple');

    router.get('/', function(req, res) {
        res.json({'foo':'bar'});
    });

    router.post('/login', function(req, res) {
        if(req.body && req.body.username && req.body.password)
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
                                    else res.send(doc);
                                });
                            }
                        });
                    }
                    else { //Does User exist on www.xrc.co.za
                        Authenticate(user, req.body.password, req, res);
                    }
                }
            });            
        }
        else return res.json({'error':'Wrong Username or Password'});
    });

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

    return router;
})();