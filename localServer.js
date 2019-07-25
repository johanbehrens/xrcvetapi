var fetch = require('node-fetch');
var ip = require('ip');
var macaddress = require('macaddress');
const client = require("mongodb").MongoClient;
client.connect('mongodb://localhost:27017', connected);
var SMB2 = require('smb2');
var Parser = require('node-dbf');
var XLSX = require('xlsx')

let db;
let ipadd = ip.address();
let state = {
    ip: ipadd,
    timer: 10000,
};
let serverIp = 'http://209.97.178.43:3000';

function connected(err, client) {
    if (err) {
        throw err;
    }
    db = client.db('xrcvet');
    getMacAddress();
}

function getMacAddress() {
    macaddress.one(function (err, mac) {
        state.mac = mac;
        console.log(mac);
        DoStatusUpdate();
    });
}

function DoStatusUpdate() {
    fetch(serverIp + "/results/status", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(state)
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (res) {
            console.log(res);
            state = res;
            state.status = parseInt(res.status);
            state.type = res.type;
            state.timer = res.timer;
            if (!res.raceId) {
                state.status = 1;
                state.error = 'Set RaceId';
                setTimeout(DoStatusUpdate, state.timer, 'funky');
                return;
            }
            else {
                state.error = 'na';
            }
            state.raceId = res.raceId;

            if (res.status == 0) clearDatabase();
            else if (res.status == 1) clearEntries();
            else if (res.status == 2) updateResults();
        })
        .catch(function (err) {
            if (err) {
                console.error('main: ' + err);
                state.error = err;
            }
            else delete state.error;
            setTimeout(DoStatusUpdate, state.timer, 'funky');
            console.error(err);
        });
}

function clearDatabase() {
    console.log('clearDatabase')
    state.status = 1;
    setTimeout(DoStatusUpdate, state.timer, 'funky');
}

function clearEntries() {
    console.log('clearEntries')
    db.collection('results').deleteMany({ raceId: state.raceId }, function (err) {
        console.log('deleted');
        fetch(`${serverIp}/results/${state.type}/${state.raceId}`, {
            method: "GET"
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (res) {
                if (!res.length) {
                    state.status += 1;
                    setTimeout(DoStatusUpdate, state.timer, 'funky');
                    return;
                }
                else {
                    db.collection('results').insertMany(res, function (err, doc) {
                        if (err) {
                            console.log(err);
                            setTimeout(DoStatusUpdate, state.timer, 'funky');
                        }
                        else {
                            state.status += 1;
                            setTimeout(DoStatusUpdate, state.timer, 'funky');
                        }
                    });
                }
            });
    });
}

function updateResults() {
    //'\\\\192.168.10.109\\Movies'

    if (!state.share) state.error = 'Please add share';
    else state.error = 'na';

    if (!state.domain) state.domain = 'DOMAIN';
    if (!state.username) state.username = '';
    if (!state.password) state.password = '';

    if (state.error && state.error != 'na') {
        setTimeout(DoStatusUpdate, state.timer, 'funky');
        return;
    }

    var smb2Client = new SMB2({
        share: state.share, domain: 'DOMAIN'
        , username: state.username
        , password: state.password
    });
    console.log(state.file);
    if (!state.file) {
        smb2Client.readdir('', function (err, files) {
            console.error('read files');
            if (err) {
                console.error(err);
                state.error = err;
            }
            else state.error = 'na';
            state.files = files;

            setTimeout(DoStatusUpdate, state.timer, 'funky');
        });
    }
    else {
        smb2Client.readFile(state.file, function (err, file) {
            if (err) {
                console.error(err);
                state.error = err;
                setTimeout(DoStatusUpdate, state.timer, 'funky');
                return;
            }
            else state.error = 'na';

            var workbook = XLSX.read(file, { type: 'buffer' });
            var body = {
                items: filter(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])),
                stamp: new Date(),
                raceid: state.raceId
            }

            fetch(serverIp + "/results/" + state.type + "/" + state.raceId, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify(body)
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (res) {
                })

        });
    }

    console.log('updateResults')
}

function filter(items) {
    let newItems = [];

    items.forEach(item => {
        let mapper = [
            "TOT_TIME"
            , "TIME1"
            , "SLIP1"
            , "PULSE1"
            , "ARRIVAL1"
            , "TIME2"
            , "ARRIVAL2"
            , "SLIP2"
            , "PULSE2"
            , "TIME3"
            , "ARRIVAL3"
            , "SLIP3"
            , "PULSE3"
            , "TIME4"
            , "ARRIVAL4"
            , "SLIP4"
            , "PULSE4"
            , "DIST"
            , "Ride"
            , "AVE_SPD"
            , "CALLNAME"
            , "FNAME"
            , "DAYNO"
            , "HNAME"
            , "HCODE"]
        let returnObj = {};
        mapper.forEach(key => {
            returnObj[key] = item[key];
        });
        newItems.push(returnObj);
    });
    return newItems;
}

function pushStartTimes() {
    console.log('pushStartTimes')
}

function pushFinalResults() {
    console.log('pushFinalResults')

}