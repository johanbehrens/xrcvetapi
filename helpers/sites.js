
const mustache = require('mustache');
const rp = require('request-promise');

let xrcBaseURL = 'https://xrc.co.za/m/';
let xrcNamBaseURL = 'https://nam.xrc.co.za/m/';
let drasaBaseURL = 'https://drasa.org.za/m/';
let parkRidesBaseURL = 'http://209.97.178.43/api/';

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
        eventURL: xrcBaseURL + 'event.php?id={{id}}',
        officialsURL: xrcBaseURL + 'officials.php?id={{id}}',
        horseSummaryURL: xrcBaseURL + 'horse_results_summary.php?horseid={{id}}',
    },
    NAMEF: {
        baseURL: xrcNamBaseURL,
        resultsURL: xrcNamBaseURL + 'results.php?raceid={{id}}',
        entriesURL: xrcNamBaseURL + 'entries.php?raceid={{id}}',
        eventsURL: xrcNamBaseURL + 'events.php',
        eventURL: xrcNamBaseURL + 'event.php?id={{id}}',
        officialsURL: xrcNamBaseURL + 'officials.php?id={{id}}',
        horseSummaryURL: xrcNamBaseURL + 'horse_results_summary.php?horseid={{id}}',
    },
    DRASA: {
        baseURL: drasaBaseURL,
        resultsURL: drasaBaseURL + 'results.php?raceid={{id}}',
        entriesURL: drasaBaseURL + 'entries.php?raceid={{id}}',
        eventsURL: drasaBaseURL + 'events.php',
        eventURL: drasaBaseURL + 'event.php?id={{id}}',
        officialsURL: drasaBaseURL + 'officials.php?id={{id}}',
        horseSummaryURL: drasaBaseURL + 'horse_results_summary.php?horseid={{id}}',
    },
    PARKRIDES: {
        baseURL: parkRidesBaseURL,
        resultsURL: parkRidesBaseURL + 'rankings/m/{{id}}',
        entriesURL: parkRidesBaseURL + 'events/m/{{id}}/entries',
        eventsURL: parkRidesBaseURL + 'events/m/',
        eventURL: parkRidesBaseURL + 'events/m/{{id}}',
        officialsURL: parkRidesBaseURL + 'events/m/{{id}}/official',
        horseSummaryURL: parkRidesBaseURL + 'horses/{{id}}/summary',
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

function getEvent(type, eventid, callback) {
    if (!sites[type]) return callback('Type does not exist');

    let url = mustache.render(sites[type].eventURL, { id: eventid });

    GET(url, callback);
}

function getOfficials(type, eventid, callback) {
    if (!sites[type]) return callback('Type does not exist');

    let url = mustache.render(sites[type].officialsURL, { id: eventid });

    GET(url, callback);
}

function getEntries(type, eventid, callback) {
    if (!sites[type]) return callback('Type does not exist');

    let url = mustache.render(sites[type].entriesURL, { id: eventid });

    GET(url, callback);
}

function getHorseSummary(type, horseRef, callback) {
    if (!sites[type]) return callback('Type does not exist');

    let url = mustache.render(sites[type].horseSummaryURL, { id: horseRef });

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
            return callback(err.statusCode);
        });
}

module.exports = {
    getResults,
    getEvents,
    getEvent,
    getEntries,
    getOfficials,
    getHorseSummary
}