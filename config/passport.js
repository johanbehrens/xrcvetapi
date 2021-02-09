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
                client.valid = false;
                if(client.currentSubscription) {
                    var today = new Date();
                    //today.setHours(today.getHours() - 2);
                    if(client.currentSubscription.expires_date) client.valid = client.currentSubscription.expires_date > today;
                    else client.valid = client.currentSubscription.end_date > today;
                }

                done(null, client);
            } else {
                done(null, false);
            }
        });
    }));
};