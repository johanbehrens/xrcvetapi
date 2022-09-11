var net = require('net');
var server = net.createServer();
server.on('connection', handleConnection);

let connections = [];

server.listen(8082, function () {
    console.log('server listening to %j', server.address());
});

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
                console.log('reply:', o);
            }
            else if (command == '5') {
                console.log('heartbeat:', data);
            }
            else if (command == '7') {
                console.log('heartbeat:', data);
            }
            else if (command == 'D') {
                let event = (parseInt(data[7], 16).toString(2)).padStart(8, '0');
                let obj = {
                    date: new Date(data[1]),
                    time: data[2],
                    latitude: data[3],
                    longitude: data[4],
                    speed: data[5],
                    direction: data[6],
                    singalStrength: convertNumber(event.substring(0, 4), 2, 10),
                    movementAlarm: event.substring(4, 5),
                    motionAlarm: event.substring(5, 6),
                    lowBattery: event.substring(6, 7),
                    geo3: event.substring(7, 8),
                    geo2: event.substring(8, 9),
                    geo1: event.substring(9, 10),
                    fallDown: event.substring(10, 11),
                    overSpeed: event.substring(11, 12),
                    sos: event.substring(12, 13),
                    gps: event.substring(15, 17),
                    signal: event.substring(17, 19),
                    altitude: data[8],
                    battery: data[9]
                }
                console.log(c.IMEI,event, obj, d);
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
                cc.socket.write(data[2] + ',' + data[3]);
            }
            catch (err) {
                console.log('Command Err', err)
            }
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