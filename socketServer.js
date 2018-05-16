var net = require('net');
var crc16 = require('js-crc').crc16;
var IpConfig = require('./app/models/ipconfig');

const commands = {
    ping: 1,
    setValue:2,
    setFlash: 3,
    count: 4
};

var client;
var clients = [];

module.exports = { setValue:setValue, setFlash:setFlash, ping:ping, registerHeartbeatDevice:registerHeartbeatDevice, setIPAddress:setIPAddress, getAllClients:getAllClients};

function registerHeartbeatDevice(identifier, callback) {
    IpConfig.findOne({
        identifier: identifier
    }, function(err, device) {
        if(!device) {
            var newDevice = new IpConfig({
                identifier: identifier,
                ip: '',
                port: ''
            });

            newDevice.save(function(err){
                if(err) {
                    return callback(err);
                }

                return callback();
            });
        }
        else return callback()
    });
}

function setIPAddress(identifier, ip, port, callback) {
    IpConfig.findOne({
        identifier: identifier
    }, function(err, device) {
        if(device) {
            device.ip = ip;
            device.port = port;

            device.save(function(err){
                if(err) {
                    return callback(err);
                }

                return callback();
            });
        }
        else {
            return callback('Device not found, please register the device');
        }
    });
}

function socketClient(identifier, callback) {
    var displayClient = clients.find(function (client) {
        return client.identifier === identifier;
    });

    if (!displayClient || displayClient == undefined) {
        IpConfig.findOne({
            identifier: identifier
        }, function (err, device) {
            if (device) {
                displayClient = {};
                displayClient.ip = device.ip;
                displayClient.port = device.port;
                displayClient.isActive = false;
                displayClient.identifier = identifier;

                clients.push(displayClient);
                return connectDisplay(displayClient, callback);
            }
            else {
                return callback('Display not registered yet');
            }
        });
    }

    else return connectDisplay(displayClient, callback);
}

function getAllClients(callback) {
    IpConfig.find({}, function (err, clients) {
        if (err) {
            return callback(err);
        }
        return callback(null, clients);
    });
}

function connectDisplay(displayClient, callback) {
    if (displayClient.ip == '' || displayClient.port == '') {
        return callback('IP or PORT not set');
    }

    if(!displayClient.isActive)  {
        displayClient.client = new net.Socket();
        displayClient.client.connect(displayClient.port, displayClient.ip, function() {
            displayClient.isActive = true;
            console.log('CONNECTED TO: ' + displayClient.ip + ':' + displayClient.port);
        });

        displayClient.client.on('data', function(data) {
            const buff = Buffer.from(data);
            var crcbuf = Buffer.from(crc16(buff.slice(0,3)), "hex") ;
            if(buff.slice(3,5).equals(crcbuf)) {
                const command = buff[1];
                console.log(command);
            }
        });

        displayClient.client.on('close', function() {
            console.log('Connection closed');
            displayClient.isActive = false;
        });

        displayClient.client.on('error', function(ex) {
            console.log('Error on connection handled:'+ex);
            displayClient.client.destroy();
            displayClient.isActive = false;
        });
    }

    return callback();
}

function setValue(identifier, valueBuffer, callback) {
    socketClient(identifier, connected);
    function connected(err) {
        if (err) {
            return callback(err);
        }
        return sendCommand(identifier, commands.setValue, valueBuffer, callback);
    }
}

function setFlash(identifier, valueBuffer, callback) {
    socketClient(identifier, connected);
    function connected(err) {
        if (err) {
            return callback(err);
        }
        return sendCommand(identifier, commands.setFlash, valueBuffer, callback);
    }
}

function ping(identifier, callback) {
    socketClient(identifier, connected);
    function connected(err) {
        if (err) {
            console.log(err);
            return callback(err);
        }

        return sendCommand(identifier, commands.ping, Buffer.from('00', 'hex'), callback);
    }
}

function sendCommand(identifier, command, valueBuff, callback) {
    try {

        var displayClient = clients.find(function (client) {
            return client.identifier === identifier;
        });

        var allocBuf = Buffer.alloc(4);
        valueBuff = Buffer.from(valueBuff.toString('hex').match(/.{2}/g).reverse().join(""),'hex');
        valueBuff.copy(allocBuf,0);
        const size = allocBuf.length;

        console.log('sendCommand'+identifier+ ' command:' + command + ' buff:' + valueBuff.toString('hex'));

        var buf = Buffer.alloc(256);
        buf[0] = 0x5a;
        buf[1] = command;
        buf[2] = size;

        allocBuf.copy(buf, 3);
        var crcbuf = Buffer.from(crc16(buf.slice(0, 3 + size)), "hex");
        crcbuf.copy(buf, 3 + size);

        console.log(buf);
        console.log(buf.slice(0, 3 + size + 2));
        if(displayClient === undefined){
            console.log('Client is undefined');
            return callback('Client is undefined');
        }
        //console.log('Before write');
        displayClient.client.write(buf.slice(0, 3 + size + 2));
        //console.log('After write');
    }
    catch(err){
        console.log('Error:' + err);
        return callback(err);
    }
    //console.log('callback');
    return callback();
}
