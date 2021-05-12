const initDb = require("./db").initDb;
const { getDb } = require("./db");

initDb({}, function (err) {

    let db = getDb();
    db.collection('location').find({ raceId: '454' }).toArray(function (err, locations) {

       // let l = locations.find(i => !!i.locations && i.locations.length > 100);


        locations.forEach(l => {

           
            console.log(l.CERTNAME, l.TOT_TIME, l.AVE1_SPD)

            if(!l.locations || l.locations.length < 100) return;

            function getTime(date, timeStamp) {
                let h = timeStamp.split(':');
                let newDate = new Date(date);
                newDate.setHours(h[0], h[1], h[2]);
                return newDate;
            }

            let startTime1 = getTime(l.date, l.TIME1);
            let arrivalTime1 = getTime(l.date, l.ARRIVAL1);

            let startTime2 = getTime(l.date, l.TIME3);
            let arrivalTime2 = getTime(l.date, l.ARRIVAL2);

            let startTime3 = getTime(l.date, l.TIME5);
            let arrivalTime3 = getTime(l.date, l.ARRIVAL3);

            let startTime4 = getTime(l.date, l.TIME7);
            let arrivalTime4 = getTime(l.date, l.ARRIVAL4);

            let leg1 = l.locations.filter(i => new Date(i.timestamp) >= startTime1 && new Date(i.timestamp) <= arrivalTime1);
            let leg2 = l.locations.filter(i => new Date(i.timestamp) >= startTime2 && new Date(i.timestamp) <= arrivalTime2);
            let leg3 = l.locations.filter(i => new Date(i.timestamp) >= startTime3 && new Date(i.timestamp) <= arrivalTime3);
            let leg4 = l.locations.filter(i => new Date(i.timestamp) >= startTime4 && new Date(i.timestamp) <= arrivalTime4);

            function doLeg(legLocations) {
                let min = 9999999999999999999999;
                let max = 0;
                let sCount = 0;
                let wCount = 0;
                let tCount = 0;
                let cCount = 0;
                let gCount = 0;

                let locationsUpdated = legLocations.map(i => {
                    if (i.odometer < min) min = i.odometer;
                    if (i.odometer > max) max = i.odometer;

                    let type = ''
                    if ((i.speed * 3.6) <= 0) { type = 'STAND'; sCount++ }
                    else if ((i.speed * 3.6) < 6.4) { type = 'WALK'; wCount++ }
                    else if ((i.speed * 3.6) < 19) { type = 'TROT'; tCount++ }
                    else if ((i.speed * 3.6) < 24) { type = 'CANTER'; cCount++ }
                    else { type = 'GALLOP'; gCount++ }

                    return {
                        ...i,
                        type
                    }
                });

                return {
                    distance: (max - min) / 1000,
                    stand: sCount / legLocations.length * 100,
                    walk: wCount / legLocations.length * 100,
                    trot: tCount / legLocations.length * 100,
                    canter: cCount / legLocations.length * 100,
                    gallop: gCount / legLocations.length * 100,
                };
            }

            console.log(doLeg(leg1));
            console.log(doLeg(leg2));
            console.log(doLeg(leg3));
            console.log(doLeg(leg4));

        });

    });

})
