const initDb = require("./db").initDb;
const AddLocationPoint = require("./routes/lora").AddLocationPoint;


initDb({}, function (err) {
AddLocationPoint({ 
   
    "app_id" : "xrc", 
    "dev_id" : "horse-1", 
    "hardware_serial" : "70B3D5705000F910", 
    "port" : 1, 
    "counter" :12, 
    "payload_raw" : "C/vb6+u/AAsAANI=", 
    "payload_fields" : {
        "batV" : 5.25, 
        "fixFailed" : false, 
        "headingDeg" : 0, 
        "inTrip" : false, 
        "latitudeDeg" : -33.7904885, 
        "longitudeDeg" : 18.4598507, 
        "speedKmph" :0, 
        "type" : "position"
    }, 
    "metadata" : {
        "time" : "2021-05-14T06:33:45.138311088Z", 
        "frequency" : 867.5, 
        "modulation" : "LORA", 
        "data_rate" : "SF11BW125", 
        "coding_rate" : "4/5", 
        "gateways" : [
            {
                "gtw_id" : "eui-3135323533001b00", 
                "timestamp" : 3494377720.0, 
                "time" : "2021-05-14T06:31:51.457496Z", 
                "channel" :5, 
                "rssi" : -110, 
                "snr" : -4.75, 
                "rf_chain" : 0
            }, 
            {
                "gtw_id" : "eui-60c5a8fffe74d225", 
                "timestamp" : 206560980, 
                "time" : "2021-05-14T06:33:45.015476Z", 
                "channel" : 5, 
                "rssi" : -113, 
                "snr" : -1.8, 
                "rf_chain" : 0, 
                "latitude" : -33.92022, 
                "longitude" : 18.38322, 
                "altitude" : 331
            }
        ]
    }, 
    "downlink_url" : "https://integrations.thethingsnetwork.org/ttn-eu/api/v2/down/xrc/xrc?key=ttn-account-v2.LFPXXPjbNpXJh1R_qVmTmpAXBRFikkzFEnrk1Ah8NWg"
});

});