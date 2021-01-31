const getDb = require("../database").getDb;
const client = require("mongodb").MongoClient;
const mustache = require('mustache');
const helper = require('../helpers/helper');
var ObjectId = require('mongodb').ObjectID;

function RunQuery(params, data, callback) {

  var db = getDb();
  if(typeof params.connectionId != 'object') params.connectionId = ObjectId(params.connectionId);
  db.collection('connections').findOne({ _id: params.connectionId }, function (err, connection) {
    if (err) {
      console.log(err);
      return callback(err);
    }
    else if (!connection) {
      err = { message: 'Connection not found!' };
      console.log(err);
      return callback(err);
    }
    doWork(connection);
  });

  function doWork(connection) {
    client.connect(connection.server, connected);
    function connected(err, client) {
      if (err) {
        console.log(err);
        client.close();
        return callback(err);
      }
      let mongo = client.db(connection.database);

      var filter = JSON.parse(mustache.render(JSON.stringify(params.filter),data));
      var toUpdate = JSON.parse(mustache.render(JSON.stringify(params.data),data));
      
      if(params.skip && !toUpdate[params.skip]) {
        console.log(`skipping ${params.skip} update`);
        return callback(null, data);
      }
      else {
        console.log(`updating ${filter}`);
      }

      mongo.collection(params.collection).updateOne(
        filter,
        {
            $set: toUpdate
        },
        { upsert: true }, function (err, result) {
          client.close();
          if (err) {
            return callback(err);
          }
          return callback(null, data);
        });      
    }
  }
}

function Validation (){
  const template = [
      {
        type: 'object',
        required: true,
        name: 'filter'
    },{
      type: 'string',
      required: true,
      name: 'data'
  },{
        type: 'connection',
        required: true,
        name: 'connectionId'
    }
  ];

  return template;
}

module.exports = {
  RunQuery,
  Validation
}