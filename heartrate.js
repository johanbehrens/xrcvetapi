var net = require('net');
var SerialPort = require('serialport');
var port = new SerialPort('/dev/ttyUSB0',{baudRate: 115200});
var Client = require('node-rest-client').Client;
var client = new Client();

client.registerMethod("getAllClients", "http://localhost:8080/api/heartBeat/getAllClients", "GET");
client.registerMethod("register", "http://localhost:8080/api/heartBeat/register", "POST");
client.registerMethod("setValue", "http://localhost:8080/api/heartBeat/setValue", "POST");

var arr = {};
var clients = [];

Test();
//refreshClients(foundClients);

function refreshClients(callback) {
    client.methods.getAllClients(function (data, response) {
        if(data.success === true){
            clients = data.clients;
            return callback(true);
        }
        return callback(false);
    });
}

function Test() {
    var id = 'abc';
    register(id, registered);
    function registered() {
        console.log('registered');
        refreshClients(refreshAndSetValue);
    }
    function refreshAndSetValue() {
        setValue(id, 'f3',doneSet);
    }
    function doneSet(){
        console.log('done setValue');
    }
}

function register(id, callback) {
    var args = {
        data: { identifier: id },
        headers: { "Content-Type": "application/json" }
    };
    client.methods.register(args, function (data, response) {
        console.log(data);
        return callback();
    });
}

function setValue(id, value, callback) {
    var args = {
        data: { identifier: id, value: value },
        headers: { "Content-Type": "application/json" }
    };
    client.methods.setValue(args, function (data, response) {
        console.log(data);
        return callback();
    });
}

port.on('data', function (data) {
    const buff = Buffer.from(data);
    const id = buff.slice(1,3).toString('hex');
    const p = parseInt(buff.slice(4,5).toString('hex'), 16);
    const d = new Date();

    if(p > 0) {
        console.log('Pulse: ' + d + ' - ' + p);
        if(!arr[id]) {
            arr[id] = [];
        }

        arr[id].push(p);

        if (arr[id].length > 14) {
            var sum = arr[id].reduce(function (a, b) {
                return a + b;
            });
            var avg = sum / arr[id].length;
            const hexString = avg.toString(16);
            const buff1 = Buffer.from(hexString, 'hex');
            console.log('Sending: ' + avg);
            setValue(id, buff1, valueSent);
            function valueSent(data) {
                if(data.success === true) arr[id] = [];
            }
        }
        else{
            const hexString = arr[id].length.toString(16);
            const buff1 = Buffer.from(hexString, 'hex');
            console.log('Reading: ' + arr[id].length);
        }
    }
});

port.on('readable', function () {
    console.log('Data:', port.read().toString('utf8y'));
});

port.write('main screen turn on', function(err) {
    if (err) {
        return console.log('Error on write: ', err.message);
    }
    console.log('message written');
});

port.on('error', function(err) {
    console.log('Error: ', err.message);
});
