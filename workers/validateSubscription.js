const getDb = require("../db").getDb;
var iap = require('in-app-purchase');
var ObjectID = require('mongodb').ObjectID;
var { enqueueJob } = require('../helpers/jobqueue');

function Validate(params, callback) {
    var db = getDb();
    db.collection('users').findOne({ _id: ObjectID(params.userId) }, function (err, user) {
        if (err) return callback(err);

        let subscription = user.currentSubscription;
        try {
            if (subscription.app === 'ios' && subscription.expires_date) return;
            processPurchase(subscription.app, subscription.user_id, subscription.app === 'ios' ? subscription.latest_receipt : JSON.parse(subscription.latest_receipt), subscription.end_date);
        } catch (err) {
            console.error('Failed to validate subscription', subscription.id);
            return callback('Failed to validate subscription');
        }
        return callback(null, params);
    });
}

async function processPurchase(app, userId, receipt, oldEndDate) {
    let configObject = {
        appleExcludeOldTransactions: true, // if you want to exclude old transaction, set this to true. Default is false
        applePassword: '1ef76688cc1b49ada11a26692dc5aa33',

        googleAccToken: '4/0AY0e-g4pg9Ov7z-mAjNmk5PGEvd_UswYBf62WEQlIue4VBkJhFWBx3WPXnRFrBOIKHJXIA', // optional, for Google Play subscriptions
        googleRefToken: '1//04ZuNNRJBnifDCgYIARAAGAQSNwF-L9IrX3taS3qArjf-KCATiGkpP3QsyMQBHh88AS19rzA0pSbEqTbE9zQCh_IdJ3cJqPkVPXo', // optional, for Google Play subscritions
        googleClientID: '468175970563-5o1kca6vjv7bg56ncscf0nm2asofb96k.apps.googleusercontent.com', // optional, for Google Play subscriptions
        googleClientSecret: 'bv55F8vwtrQ9MPPExWYR7oHd', // optional, for Google Play subscriptions

        test: false, // For Apple and Googl Play to force Sandbox validation only
        verbose: false // Output debug logs to stdout stream
    }

    iap.config(configObject);

    await iap.setup();
    const validationResponse = await iap.validate(receipt);

    const purchaseData = iap.getPurchaseData(validationResponse);
    const firstPurchaseItem = purchaseData[0];

    const isCancelled = iap.isCanceled(firstPurchaseItem);
    const isExpired = iap.isExpired(firstPurchaseItem);
    const { productId } = firstPurchaseItem;
    const origTxId = app === 'ios' ? firstPurchaseItem.originalTransactionId : firstPurchaseItem.transactionId;
    const latestReceipt = app === 'ios' ? validationResponse.latest_receipt : JSON.stringify(receipt);
    const startDate = app === 'ios' ? new Date(firstPurchaseItem.originalPurchaseDateMs) : new Date(parseInt(firstPurchaseItem.startTimeMillis, 10));
    const endDate = app === 'ios' ? new Date(firstPurchaseItem.expiresDateMs) : new Date(parseInt(firstPurchaseItem.expiryTimeMillis, 10));

    let environment = '';
    // validationResponse contains sandbox: true/false for Apple and Amazon
    // Android we don't know if it was a sandbox account
    if (app === 'ios') {
        environment = validationResponse.sandbox ? 'sandbox' : 'production';
    }

    await updateSubscription({
        userId,
        app,
        environment,
        productId,
        origTxId,
        latestReceipt,
        validationResponse,
        startDate,
        endDate,
        isCancelled,
        oldEndDate
    });

    // From https://developer.android.com/google/play/billing/billing_library_overview:
    // You must acknowledge all purchases within three days.
    // Failure to properly acknowledge purchases results in those purchases being refunded.
    if (app === 'android' && validationResponse.acknowledgementState === 0) {
        await androidGoogleApi.purchases.subscriptions.acknowledge({
            packageName: androidPackageName,
            subscriptionId: productId,
            token: receipt.purchaseToken,
        });
    }

    if (isCancelled) return { status: 999 };
    if (isExpired) return { status: 999 };
    return { status: firstPurchaseItem.status };
}

async function updateSubscription({
    app, environment, origTxId, userId, validationResponse, latestReceipt, startDate, endDate, productId, isCancelled, oldEndDate
}) {
    if (oldEndDate.toString() == endDate.toString()) {
        //nothing to do, subscription date is still the same
        console.log('nothing to do, subscription date is still the same')
        return;
    }

    const data = {
        app,
        environment,
        user_id: userId,
        orig_tx_id: origTxId,
        validation_response: JSON.stringify(validationResponse),
        latest_receipt: latestReceipt,
        start_date: startDate,
        end_date: endDate,
        product_id: productId,
        is_cancelled: isCancelled,
    };

    try {
        var db = getDb();
        await db.collection('users').updateOne(
            { _id: userId },
            {
                $set: { currentSubscription: data },
                $push: { reciepts: data }
            });

        enqueueJob({
            jobName: 'validateSubscription',
            data: { userId },
            date: endDate
        }, function (err, arg) {
            if (err) console.log(err)
            else console.log('subscripition queued');
        })
    } catch (err) {
        console.log(err.stack);

    }
}

module.exports = {
    Validate
}