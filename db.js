const client = require("mongodb").MongoClient;
const config = require("./config/database");
let _db;

function initDb(callback) {
    if (_db) {
        return callback(null, _db);
    }

    client.connect(config.database, connected);
    function connected(err, client) {
        if (err) {
            return callback(err);
        }
        _db = client.db('xrc');
        return callback(null, _db);
    }
}

function getDb() {
    return _db;
}

module.exports = {
    getDb,
    initDb
};