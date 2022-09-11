var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var ObjectID = require('mongodb').ObjectID;
var { PingDevice, RefreshDeviceInfo, isConnected } = require('../helpers/gps');

router.get('/', GetDevices);
router.post('/', AddDevice);
router.delete('/:id', RemoveDevice);

function RemoveDevice(req, res) {
    var db = getDb();
    console.log('RemoveDevice:' + req.params.id);

    db.collection('device').deleteOne({ _id: ObjectID(req.params.id) }, function (err, result) {
        if (err) {
            res.status(500);
            res.json({
                error: err.message
            });
        }
        else res.send({ result: 1 });
    });
}

function GetDevices(req, res) {
    var db = getDb();
    console.log('GetDevices');

    db.collection('device').aggregate([
        {
            $match: {
                userId: req.user._id
            }
        }
    ]).toArray(function (err, devices) {
        console.log('return GetDevices');
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            res.send(devices.map(d => {
                return {
                    ...d,
                    isConnected: isConnected(d.IMEI)
                }
            }));
        }
    });
}

function AddDevice(req, res) {
    var db = getDb();

    if (req.body._id) req.body._id = new ObjectID(req.body._id);
    req.body.userId = req.user._id;

    if (req.body._id) {
        //Save 
        db.collection('device').replaceOne({ _id: req.body._id }, req.body, function (err, device) {
            return res.send(device.ops[0]);
        });
    }
    else {
        if (req.body.IMEI) {

            db.collection('device').findOne({ IMEI: req.body.IMEI }, function (err, odevice) {

                if (err) {
                    res.status(500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                }
                else {
                    if (odevice) return res.send({ error: 'This device is already linked, please unlink the device first.' });
                    else PingDevice(req.body.IMEI, didFind);
                }
            });

            function didFind(found) {
                if (!found) return res.send({ error: 'Device not found. Please make sure your device is switched on and you pressed the SOS button.' });
                else {
                    db.collection('device').insertOne(req.body, function (err, device) {
                        RefreshDeviceInfo(req.body.IMEI, deviceInfo);
                        function deviceInfo(found, data) {
                            if (!found) return res.send(device.ops[0]);
                            else {
                                db.collection('device').replaceOne({ _id: device.ops[0]._id }, { ...req.body, ...data, lastUpdated: new Date() }, function (err, device) {
                                    return res.send(device.ops[0]);
                                });
                            }
                        }

                    });
                }
            }
        }
        else {
            return res.send({ error: 'Please enter your device IMEI number' });
        }
    }
}


module.exports = router;