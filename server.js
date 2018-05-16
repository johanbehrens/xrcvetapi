var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport	= require('passport');
var config      = require('./config/database'); // get db config file
var User        = require('./app/models/user'); // get the mongoose model
var Race       = require('./app/models/race'); // get the mongoose model
var Horse       = require('./app/models/horse'); // get the mongoose model
var port        = process.env.PORT || 8080;
var jwt         = require('jwt-simple');
var socketServer        = require('./socketServer');
require('epson-thermal-printer')
var Parser = require('node-dbf');

// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());

// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// Start the server
app.listen(port);
console.log('There will be dragons: http://localhost:' + port);

// connect to database
mongoose.connect('mongodb://localhost:27017/xrcvet');

// pass passport for configuration
require('./config/passport')(passport);

// bundle our routes
var apiRoutes = express.Router();

// create a new user account (POST http://localhost:8080/api/signup)
apiRoutes.post('/signup', function(req, res) {
    if (!req.body.name || !req.body.password) {
        return res.json({success: false, msg: 'Please pass name and password.'});
    } else {
        createUser(req.body.name, req.body.password, created);

        function created(err) {
            if (err){
                return res.json({success: false, msg: 'Username already exists.'});
            }

            return res.json({success: true, msg: 'Successful created new user.'});
        }
    }
});

function createUser(user, pass, callback) {
    var newUser = new User({
        name: user,
        password: pass
    });
    // save the user
    newUser.save(function(err) {
        if (err) {
            return callback(err);
        }
        return callback();
    });
}

// connect the api routes under /api/*
app.use('/api', apiRoutes);

apiRoutes.post('/authenticate', function(req, res) {
    User.findOne({
        name: req.body.name
    }, function(err, user) {
        if (err) throw err;

        if (!user) {
            User.count({}, function(err, c) {
                if (c === 0) {
                    createUser('admin', 'admin', created);

                    function created(err) {
                        if (err){
                            res.json({success: false, msg: err});
                        }
else {
                            var token = jwt.encode(user, config.secret);
                            res.json({success: true, token: 'JWT ' + token});
                        }
                    }
                }
                else {
                    res.send({success: false, msg: 'Authentication failed. Wrong password.'});
                }
            });
        } else {
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (isMatch && !err) {
                    var token = jwt.encode(user, config.secret);
                    res.json({success: true, token: 'JWT ' + token});
                } else {
                    res.send({success: false, msg: 'Authentication failed. Wrong password.'});
                }
            });
        }
    });
});

apiRoutes.post('/addrace', function(req, res) {
    Race.findOne({
        name: req.body.name
    }, function(err, race) {
        if (err) throw err;

        if (!race) {
            var newRace = new Race({
                name: req.body.name,
                isActive: false
            });

            newRace.save(function(err) {
                if (err) {
                    return res.send({success: false, msg: 'Race already exists.'});
                }
                res.json({success: true, race: newRace._id});
            });
        } else {
            res.send({success: false, msg: 'Race already exists.'});
        }
    });
});

apiRoutes.post('/setRaceActive', function(req, res) {
    Race.findOne({
        _id: req.body.raceid
    }, function(err, race) {
        if (err) throw err;

        if (!race) {
            return res.send({success: false, msg: 'Race not found.'});
        } else {
            Race.findOne({
                _id: req.body.raceid
            }, function(err, activeRace) {
                activeRace.isActive = false;
                activeRace.save(function(err){
                    if(err) {
                        return res.json({success: false, race: race});
                    }

                    race.isActive = true;
                    race.save(function(err){
                        if(err) {
                            return res.json({success: false, race: race});
                        }
                        res.json({success: true, race: race});
                    });
                });
            });
        }
    });
});

apiRoutes.post('/addhorse', function(req, res) {
    Race.findOne({
        _id: req.body.raceid
            }, function(err, race) {
                if (!race) {
                    return res.status(403).send({success: false, msg: 'Race not found.'});
                } else {
                    var newHorse = new Horse({
                        name: req.body.name,
                        code: req.body.code,
                        race: race._id
                    });

                    newHorse.save(function(err) {
                        if (err) {
                            return res.send({success: false, msg: err});
                        }
                        race.horses.push(newHorse._id);
                        race.save(function(err) {
                            if (err) {
                                return res.send({success: false, msg: err});
                            }
                            res.json({success: true, horse: newHorse});
                        });
                    });

                }
            });
});

apiRoutes.get('/memberinfo', passport.authenticate('jwt', { session: false}), function(req, res) {
    var token = getToken(req.headers);
    if (token) {
        var decoded = jwt.decode(token, config.secret);
        User.findOne({
            name: decoded.name
        }, function(err, user) {
            if (err) throw err;

            if (!user) {
                return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
            } else {
                res.json({success: true, msg: 'Welcome in the member area ' + user.name + '!'});
            }
        });
    } else {
        return res.status(403).send({success: false, msg: 'No token provided.'});
    }
});

apiRoutes.get('/getraces', function(req, res) {
    Race.find({}, function(err, races) {
        res.json(races.map(function(item, err) {
            return {name: item.name, id: item._id};
        }));
    });
});

apiRoutes.get('/race/:raceid', function(req, res) {
    Race.findOne({
        _id: req.params.raceid
    }, function(err, race) {
        if (!race) {
            return res.status(403).send({success: false, msg: 'Race not found.'});
        } else {
            res.json({success: true, race: race});
        }
    });
});

apiRoutes.post('/updateHorse', function(req, res) {
    Horse.findOne({
        _id: req.body.horseid
    }, function(err, horse) {
        if (!horse) {
            return res.status(403).send({success: false, msg: 'Horse not found.'});
        } else {
            horse[req.body.prop] = req.body.value;
            horse.save(function(err, product, numAffected){
                res.json({success: true, horse: horse});
            });


        }
    });
});

apiRoutes.get('/vetCard/:horseid/leg/:leg', function(req, res) {
    Horse.findOne({
        _id: req.params.horseid
    }, function(err, horse) {
        if (!horse) {
            return res.status(403).send({success: false, msg: 'Horse not found.'});
        } else {

            res.json({success: true, vetCard: {
                HYDR: horse['HYDR'+req.params.leg],
                LOCO: horse['LOCO'+req.params.leg],
                HABI: horse['HABI'+req.params.leg],
                MEMB: horse['MEMB'+req.params.leg],
                CAP: horse['CAP'+req.params.leg],
                GUT: horse['GUT'+req.params.leg],
                COMMENT: horse['COMMENT'+req.params.leg],
                GWB: horse['GWB'+req.params.leg],
                DISQLEG: horse['DISQLEG'],
                DISQ: horse['DISQ'],
                REASON: horse['REASON']
        }});
        }
    });
});

apiRoutes.post('/updateVetCard', function(req, res) {
    Horse.findOne({
        _id: req.body.horseid
    }, function(err, horse) {
        if (!horse) {
            return res.status(403).send({success: false, msg: 'Horse not found.'});
        } else {

            horse['HYDR'+req.body.leg] = req.body.vetCard.HYDR;
            horse['LOCO'+req.body.leg] = req.body.vetCard.LOCO;
            horse['HABI'+req.body.leg] = req.body.vetCard.HABI;
            horse['MEMB'+req.body.leg] = req.body.vetCard.MEMB;
            horse['CAP'+req.body.leg] = req.body.vetCard.CAP;
            horse['GUT'+req.body.leg] = req.body.vetCard.GUT;
            horse['COMMENT'+req.body.leg] = req.body.vetCard.COMMENT;
            horse['GWB'+req.body.leg] = req.body.vetCard.GWB;

            if(req.body.vetCard.DISQ) {
                horse['DISQLEG'] = req.body.vetCard.leg;
                horse['DISQ'] = req.body.vetCard.DISQ;
                horse['REASON'] = req.body.vetCard.REASON;
            }

            horse.save(function(err, product, numAffected){
                res.json({success: true, horse: horse});
            });


        }
    });
});

apiRoutes.get('/horse/:horseid', function(req, res) {
    Horse.findOne({
        _id: req.params.horseid
    }, function(err, horse) {
        if (!horse) {
            return res.status(403).send({success: false, msg: 'Horse not found.'});
        } else {
            res.json({success: true, horse: horse});
        }
    });
});

apiRoutes.get('/gethorses', function(req, res) {
    Horse.find({
        race: req.query.raceid
    }, function(err, horses) {
        if (!horses) {
            return res.status(403).send({success: false, msg: 'horses not found.'});
        } else {
            res.json({success: true, horses: horses});
        }
    });
});

apiRoutes.get('/getracestoimport', function(req, res) {
    var readDirFiles = require('read-dir-files');

    readDirFiles.list('./imports', function (err, filenames) {
        if (err) return res.json({success: false});

        res.json({success: true, races: filenames.filter(function(file,i) {
            if (i === 0) {
                return false; // skip
            }
            return true;
        }).map(function(filename,i) {
            return {name: filename, id:i};
        })});
    });
});

apiRoutes.post('/importHorses', function(req, res) {
    Race.findOne({
        name: req.body.name
    }, function(err, race) {
        if (err) throw err;

        if (!race) {
            var newRace = new Race({
                name: req.body.name
            });

            newRace.save(function(err) {
                if (err) {
                    return res.send({success: false, msg: 'Race already exists.'});
                }
                var horses = [];

                var parser = new Parser(req.body.file);

                parser.on('start', function(p) {
                    console.log('dBase file parsing has started');
                });

                parser.on('header', function(h) {
                    console.log('dBase file header has been parsed',h);
                });

                parser.on('record', function(record) {
                    horses.push(record);
                    record.race = newRace._id;
                    record.name = record.HNAME;
                    record.code = record.DAYNO;
                    record.distance = record.DIST;
                    console.log('record',record);
                });

                parser.on('end', function(p) {
                    try {
                        var db = mongoose.connection;
                        db.collections.horses.insertMany(horses);
                    } catch (e) {
                        console.log(e);
                    }

                    res.json({success: true, race: newRace._id});
                });

                parser.parse();
            });
        } else {
            res.send({success: false, msg: 'Race already exists.'});
        }
    });
});

apiRoutes.post('/heartBeat/register', function(req, res) {
    socketServer.registerHeartbeatDevice(req.body.identifier, done);
    function done(err) {
        if (err) {
            return res.send({success: false, msg: err});
        }
        return res.send({success: true });
    }

});

apiRoutes.post('/heartBeat/setIp', function(req, res) {
    socketServer.setIPAddress(req.body.identifier, req.body.ip, req.body.port, done);
    function done(err) {
        if (err) {
            return res.send({success: false, msg: err});
        }

        socketServer.setFlash(req.body.identifier, Buffer.from('0', 'hex'), done);
        function done(err) {
            if (err) {
                console.log(err);
                return res.send({success: false, msg: err.message});
            }
            return res.send({success: true });
        }
    }
});

apiRoutes.post('/heartBeat/setValue', function(req, res) {
    socketServer.setValue(req.body.identifier, Buffer.from(req.body.value, 'hex'), done);
    function done(err) {
        if (err) {
            console.log(err);
            return res.send({success: false, msg: err.message});
        }
        return res.send({success: true });
    }
});

apiRoutes.post('/heartBeat/ping', function(req, res) {
    socketServer.ping(req.body.identifier, done);
    function done(err) {
        if (err) {
            return res.send({success: false, msg: err});
        }
        return res.send({success: true });
    }
});

apiRoutes.get('/heartBeat/getAllClients', function(req, res) {
    socketServer.getAllClients(done);
    function done(err, clients) {
        if (err) {
            return res.send({success: false, msg: err});
        }
        return res.send({success: true, clients: clients });
    }
});

getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};