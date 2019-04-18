var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
const getDb = require("../db").getDb;
const config = require("../config/database");

module.exports = function(passport) {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt')
    opts.secretOrKey = config.secret;

    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        var db = getDb();
        db.collection('users').findOne({emailaddress: jwt_payload.id}, function(err, client) {
            if (err) {
                return done(err, false);
            }
            if (client) {
                done(null, client);
            } else {
                done(null, false);
            }
        });
    }));
};