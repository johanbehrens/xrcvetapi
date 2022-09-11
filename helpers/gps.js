var net = require('net');
var emitter = require('events').EventEmitter;
var moment = require('moment');
const getDb = require("../db").getDb;

var em = new emitter();
var server = net.createServer();
server.on('connection', handleConnection);

let connections = [];

server.listen(8082, function () {
    console.log('server listening to %j', server.address());
});

function getEmitter() {
   return em;
}

function isConnected(IMEI) {
    let cc = connections.find(i => i.IMEI == IMEI);
    if(!cc) return false;
    else return cc.connected;
}

function RefreshDeviceInfo(IMEI, callback) {
    let cc = connections.find(i => i.IMEI == IMEI);

    let found = false;
    if(!cc) return callback(false);

    try {
        cc.socket.write('123456G');
        em.on('SETTINGS', settingsReturn);

        setTimeout(function () {
            if (!found) {
                console.log('removeListener')
                em.removeListener('SETTINGS', settingsReturn);
                callback(false);
            }
        }, 10000);
    }
    catch (err) {
        return callback(false);
    }

    function settingsReturn(fIMEI, obj) {
        console.log('testing IMEI',fIMEI,IMEI);
        if (IMEI == fIMEI) {
            console.log('testing IMEI passed',fIMEI,IMEI);
            found = true;
            em.removeListener('SETTINGS', settingsReturn);
            callback(true, obj);
        }
    }


}

function PingDevice(IMEI, callback) {
    let found = false;

    function pingReturn(fIMEI, obj) {
        console.log('testing IMEI',fIMEI,IMEI);
        if (IMEI == fIMEI) {
            console.log('testing IMEI passed',fIMEI,IMEI);
            found = true;
            em.removeListener('SOS', pingReturn);
            callback(true);
        }
    }

    em.on('SOS', pingReturn);

    setTimeout(function () {
        if (!found) {
            console.log('removeListener')
            em.removeListener('SOS', pingReturn);
            callback(false);
        }
    }, 10000);
}

function convertNumber(n, fromBase, toBase) {
    if (fromBase === void 0) {
        fromBase = 10;
    }
    if (toBase === void 0) {
        toBase = 10;
    }
    return parseInt(n.toString(), fromBase).toString(toBase);
}

function handleConnection(conn) {
    let c = {
        connected: true,
        remoteAddress: conn.remoteAddress + ':' + conn.remotePort,
        IMEI: '',
        socket: conn
    }

    console.log('new client connection from %s', c.remoteAddress);
    conn.setEncoding('utf8');
    conn.on('data', onConnData);
    conn.once('close', onConnClose);
    conn.on('error', onConnError);

    function onConnData(d) {
        let cc = connections.find(i => i.IMEI == c.IMEI);

        let data = d.split(',');

        if (data[0][0] == '!') {

            let command = data[0][1];

            if (command == '1') {
                if (cc) {
                    cc.socket = conn;
                    cc.connected = true;
                    cc.remoteAddress = c.remoteAddress;
                }
                else {
                    c.IMEI = data[1];
                    connections.push(c);
                }
            }
            else if (command == '3') {
                console.log('reply:', data);
            }
            else if (command == '4') {
                let o = {
                    timeInterval: data[1],
                    emergency1: data[2],
                    emergency2: data[3],
                    emergency3: data[4],
                    timeZone: data[5],
                    speedAlarm: data[6],
                    movementAlarm: data[7],
                    motionAlarm: data[8],
                    gpsOn: convertNumber(data[9], 10, 2)[0],
                    voiceMonitor: convertNumber(data[9], 10, 2)[1],
                    gsmBase: convertNumber(data[9], 10, 2)[2],
                    ledOn: convertNumber(data[9], 10, 2)[3],
                    fallDetect: convertNumber(data[9], 10, 2)[4],
                    gpsOn: convertNumber(data[9], 10, 2)[5],
                }
                em.emit('SETTINGS', c.IMEI, o);
                console.log('reply:', o,d);
            }
            else if (command == '5') {
                console.log('heartbeat:', data);
            }
            else if (command == '7') {
                console.log('heartbeat:', data);
            }
            else if (command == 'D') {
                let event = (parseInt(data[7], 16).toString(2)).padStart(8, '0').split("").reverse().join("");
                let date = moment(data[1] + '  ' + data[2], 'DD/MM/YY HH:mm:ss');
                let obj = {
                    date: date.toDate(),
                    latitude: data[3],
                    longitude: data[4],
                    speed: data[5],
                    direction: data[6],
                    singalStrength: convertNumber(event.substring(16, 20), 2, 10),
                    movementAlarm: event.substring(15, 16),
                    motionAlarm: event.substring(14, 15),
                    lowBattery: event.substring(12, 13),
                    geo3: event.substring(11, 12),
                    geo2: event.substring(10, 11),
                    geo1: event.substring(9, 10),
                    fallDown: event.substring(8, 9),
                    overSpeed: event.substring(7, 8),
                    sos: event.substring(6, 7),
                    gps: event.substring(2, 4),
                    signal: event.substring(0, 2),
                    altitude: data[8],
                    battery: data[9]
                }

                if (obj.sos == '1') em.emit('SOS', c.IMEI, obj);
                if (obj.fallDown == '1') em.emit('FALL', c.IMEI, obj);
                if (obj.motionAlarm == '1') em.emit('MOTION', c.IMEI, obj);
                if (obj.movementAlarm == '1') em.emit('MOVEMENT', c.IMEI, obj);
                if (obj.lowBattery == '1') em.emit('BATLOW', c.IMEI, obj);

                em.emit('LOCATION', c.IMEI, obj,event);

                var db = getDb();
                db.collection('device').updateOne(
                    { IMEI: c.IMEI },
                    {
                        $set: {
                            ...obj,
                            lastUpdated: new Date()
                        }
                    },
                    { upsert: false });

                console.log(c.IMEI, obj);
            }
        }
        else if (data[0] == 'G') {
            connections.forEach(c => {
                c.socket.write('123456G');
            });
        }
        else if (data[0] == 'S') {
            console.log(connections);
        }
        else if (data[0] == 'C') {
            console.log('Command', data)
            let cc = connections.find(i => i.IMEI == data[1]);

            try {
                cc.socket.write(data[2] + ',' + ('000'+data[3]).slice(-3));
            }
            catch (err) {
                console.log('Command Err', err)
            }
        }
        else if (data[0] == 'Clear') {
            connections =[];
        }
    }
    function onConnClose() {
        let cc = connections.find(i => i.IMEI == c.IMEI);
        if (cc) cc.connected = false;
        console.log('connection from %s closed', c.remoteAddress);
    }
    function onConnError(err) {
        console.log('Connection %s error: %s', c.remoteAddress, err.message);
    }
}

module.exports = {
    PingDevice,
    RefreshDeviceInfo,
    isConnected,
    getEmitter
};