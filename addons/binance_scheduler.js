var schedule = require('node-schedule');
var util = require('util')
const Binance = require('node-binance-api');
var { enqueue } = require('../helpers/jobqueue');
var ObjectID = require('mongodb').ObjectID;

const binance = new Binance().options({
    APIKEY: 'kyp0t2oWH6xeJVPsOImnJk04hrVbILq1yGpsdiZApNYaifBsKauioovRzkPNG7FR',
    APISECRET: 'Ic4Sy9pspLhu3oC32tFSOZzmb5ZrZ0JXcVre8cJDsypIVtiJNyEheRBn43B8uhE5'
});

schedule.scheduleJob("0 */30 * * * *", function () {
    binance.prices().then(prices => {
        //  console.log(prices);
        Object.keys(prices).forEach(element => {
            if (!element.includes('BTC') > 0 || element == 'BTCBBTC') return;
            
            binance.candlesticks(element, "1d", (error, ticks, symbol) => {
                // console.info("candlesticks()", ticks);
                // console.info(symbol+" last close: "+ticks[0]);
    
                if (!ticks || !util.isArray(ticks)) return;
    
                let highest = Math.max.apply(Math, ticks.map(function (o) {
                    let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = o;
                    return high;
                }));
    
                let last_tick = ticks[ticks.length - 1];
                let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
    
                if( ((highest - close) / highest) < 0.02) {
                    sendPush(new ObjectID('5cb967737ff245517c5a7165'), symbol, "close: " + close, 'highest: '+highest);
                    console.info(symbol+": ",close, highest);
                }
            }, { limit: 90 });
        });
    })



});
console.log('Binance Scheduler started');

function sendPush(id, meterId, type, status) {
    notification = {
        userId: id,
        title: meterId,
        message: `${type} ${status}`,
        body: `${type} ${status}`,
        scheduledDate: new Date()
    };

    enqueue.sendPushNotification(notification, update);
}
function update() { }
