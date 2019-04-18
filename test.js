//const GoogleMapsAPI = require('googlemaps');

let location=
{ 
    "locationRideId" : "3AA62FDC-396B-4AF5-91B1-FF5EF2792849", 
    "username" : "behrens.johan@gmail.com", 
    "horseId" : "5cb75ca2d0b0555c881b7e0a", 
    "riderId" : "5cb75fecd0b0555c881b7e0b", 
    "raceId" : null, 
    "riderNumber" : null, 
    "locations" : [
        {
            "latitude" : -26.01102989659521, 
            "longitude" : 28.01342644333585, 
            "type" : "WATCH"
        }, 
        {
            "latitude" : -26.01102989662963, 
            "longitude" : 28.013426443322036, 
            "type" : "START"
        }, 
        {
            "latitude" : -26.01102989662963, 
            "longitude" : 28.01342644332204, 
            "type" : "WATCH"
        }, 
        {
            "latitude" : -26.01102989662963, 
            "longitude" : 28.013426443322036, 
            "type" : "SOS"
        }, 
        {
            "latitude" : -26.01104811528501, 
            "longitude" : 28.01342324821931, 
            "type" : "WATCH"
        }, 
        {
            "latitude" : -26.011048115285014, 
            "longitude" : 28.013423248219308, 
            "type" : "VET"
        }, 
        {
            "latitude" : -26.011016273144378, 
            "longitude" : 28.013433545565047, 
            "type" : "STOP"
        }
    ]
};

var path = location.locations.map(l => l.latitude+','+l.longitude).reduce((y,item) => y+'|'+item);
image2base64(`http://maps.googleapis.com/maps/api/staticmap?key=AIzaSyA6Qwnkrpop_DzlDFWhI34bB7n8BXygxYg&size=300x300&path=${path}`) // you can also to use url
    .then(
        (response) => {
            console.log(response); //cGF0aC90by9maWxlLmpwZw==
        }
    )
    .catch(
        (error) => {
            console.log(error); //Exepection error....
        }
    )

    /*
 
var publicConfig = {
    key: 'AIzaSyA6Qwnkrpop_DzlDFWhI34bB7n8BXygxYg',
    stagger_time:       1000, // for elevationPath
    encode_polylines:   false,
    secure:             true, // use https
  };
  var gmAPI = new GoogleMapsAPI(publicConfig);
  var params = {
    zoom: 15,
    size: '400x400',
    maptype: 'roadmap',
    path: [
      {
        color: '0x0000ff',
        weight: '5',
        points: [
            "40.737102,-73.990318",
            "40.749825,-73.987963",
            "40.752946,-73.987384",
            "40.755823,-73.986397"
        ]
      }
    ]
  };
  gmAPI.staticMap(params); // return static map URL
  gmAPI.staticMap(params, function(err, binaryImage) {
    console.log(binaryImage);
  });*/