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

      if (params.function) {
        let input = [];

        params.args.forEach(element => {
          if (typeof element == 'object') {
            input.push(parseInt(mustache.render(element.value, data)));
          }
          else input.push(mustache.render(element, data));
        });

        let t = helper[params.function](...input);
        params.query = t;

        console.log(t);
        mongo.collection(params.collection).aggregate(params.query).toArray(function (err, result) {
          client.close();
          if (err) {
            return callback(err);
          }
          data.payload = result;

          return callback(null, data);
        });
      }
      else {
        var query = JSON.parse(mustache.render(JSON.stringify(params.query),data));

        mongo.collection(params.collection).find(query).toArray(function (err, result) {
          client.close();
          if (err) {
            return callback(err);
          }
          data.payload = result;
          return callback(null, data);
        });
      }
    }
  }
}

function Validation (){
  const template = [
      {
        type: 'string',
        required: true,
        name: 'collection'
    },{
      type: 'string',
      required: false,
      description: 'Use the query if it is a simple mongo select query',
      name: 'query'
  },{
      type: 'string',
      required: false,
      description: 'Use the function to bind to a hard colded aggregate function',
      name: 'function'
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