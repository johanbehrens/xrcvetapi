
const mustache = require('mustache');
const rp = require('request-promise');

let xrcBaseURL = 'https://xrc.co.za/m/';
let xrcNamBaseURL = 'https://nam.xrc.co.za/m/';
let drasaBaseURL = 'https://drasa.org.za/m/';
let parkRidesBaseURL = 'https://drasa.org.za/m/';
parkRidesBaseURL = 'http://209.97.178.43/api/';

/*
 xrcBaseURL = 'http://xrc/m/';
 xrcNamBaseURL = 'http://nam/m/';
 drasaBaseURL = 'http://drasa/m/';
 parkRidesBaseURL = 'http://localhost:8080/api/';
*/

const sites = {
    ERASA: {
        baseURL: xrcBaseURL,
        resultsURL: xrcBaseURL + 'results.php?raceid={{id}}',
        entriesURL: xrcBaseURL + 'entries.php?raceid={{id}}',
        eventsURL: xrcBaseURL + 'events.php',
    },
    NAMEF: {
        baseURL: xrcNamBaseURL,
        resultsURL: xrcNamBaseURL + 'results.php?raceid={{id}}',
        entriesURL: xrcNamBaseURL + 'entries.php?raceid={{id}}',
        eventsURL: xrcNamBaseURL + 'events.php',
    },
    DRASA: {
        baseURL: drasaBaseURL,
        resultsURL: drasaBaseURL + 'results.php?raceid={{id}}',
        entriesURL: drasaBaseURL + 'entries.php?raceid={{id}}',
        eventsURL: drasaBaseURL + 'events.php',
    },
    PARKRIDES: {
        baseURL: parkRidesBaseURL,
        resultsURL: parkRidesBaseURL + 'rankings/m/{{id}}',
        entriesURL: parkRidesBaseURL + 'events/m/{{id}}/entries',
        eventsURL: parkRidesBaseURL + 'events/m/',
    }
}

function getResults(type, eventid, callback) {
    if (!sites[type]) return callback('Type does not exist');

    let url = mustache.render(sites[type].resultsURL, { id: eventid });

    GET(url, callback);
}

function getEvents(type, callback) {
    if (!sites[type]) return callback('Type does not exist');

    let url = sites[type].eventsURL;

    GET(url, callback);
}

function getEntries(type, eventid, callback) {
    if (!sites[type]) return callback('Type does not exist');

    let url = mustache.render(sites[type].entriesURL, { id: eventid });

    GET(url, callback);
}

function GET(url, callback) {
    let options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        url,
        json: true
    };

    rp(options)
        .then(function (d) {
            if (d.error) return callback(d.error);
            return callback(null, d);
        })
        .catch(function (err) {
            return callback(err.statusMessage);
        });
}

module.exports = {
    getResults,
    getEvents,
    getEntries
}