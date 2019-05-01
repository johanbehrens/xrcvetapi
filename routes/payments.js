var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var passport = require('passport');
require('../config/passport')(passport);
var fetch = require('node-fetch');

router.post('/', ValidatePayment);

function ValidatePayment(req, res) {

    if (!req.body.receipt) return res.send({ error: 'No receipt' });
    let receipt = {};
    receipt['receipt-data'] = req.body.receipt;
    receipt['password'] = '1ef76688cc1b49ada11a26692dc5aa33';
    receipt['exclude-old-transactions'] = true;

    let url = '';
    //url = 'https://buy.itunes.apple.com/verifyReceipt'; //prod
    url = 'https://sandbox.itunes.apple.com/verifyReceipt'; //test

    fetch(url, {
        method: "POST",
        body: JSON.stringify(receipt)
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (response) {
            console.log(response);
            var db = getDb();

            if (response.status == 0) {
                let ob = {
                    status: response.status,
                    expires_date: new Date(Number(response.latest_receipt_info[0].expires_date_ms)),
                    original_purchase_date: new Date(Number(response.latest_receipt_info[0].original_purchase_date_ms)),
                    product_id: response.latest_receipt_info[0].product_id,
                    transaction_id: response.latest_receipt_info[0].transaction_id,
                    original_transaction_id: response.latest_receipt_info[0].original_transaction_id
                }
                let valid = ob.expires_date > new Date();
                
                if(!valid) return res.send({ status: 999 }); 

                db.collection('users').findOne({
                    'currentSubscription.original_transaction_id': ob.original_transaction_id }, function (err, existingUser) {
                    //if (response.status) {
                    //response.status = 0;
                    if(existingUser && existingUser.emailaddress != req.user.emailaddress) {
                        console.log('Apple ID possible fraud: existing user:'+existingUser.emailaddress+' Possible fraud user:'+req.user.emailaddress);
                        return res.send({ status: 1 });
                    }
                    db.collection('users').updateOne(
                        { _id: req.user._id },
                        {
                            $set: { currentSubscription: ob },
                            $push: { reciepts: ob }
                        }, function (err, l) {
                            return res.send({ status: response.status });
                        });
                });
            }
            else {
                return res.send({ status: response.status });
            }
        }).catch(function (err) {
            console.log(err);
            res.send(err);
        });
}

module.exports = router;