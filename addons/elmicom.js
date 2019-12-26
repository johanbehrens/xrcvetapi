var express = require('express');
var router = express.Router();
const getDb = require("../db").getDb;
var { enqueue } = require('../helpers/jobqueue');
var ObjectID = require('mongodb').ObjectID;

router.get('/view', ViewMeter);
router.post('/:meterId', AddMeter);

function ViewMeter(req, res) {
    var db = getDb();

    db.collection('elmicom').find({}).sort({ status: -1 }).toArray(function (err, docs) {
        if (err) {
            res.status(500);
            res.json({
                message: err.message,
                error: err
            });
        }
        else {
            function GetCard(doc){
                var st = 'danger';
                if(doc.status && doc. eth && doc.status == 'up' && doc.eth == 'up') {
                    st = 'success';
                }
                if(doc.status && !doc. eth && doc.status == 'up') {
                    st = 'success';
                }

                return st;
            }

            var html = `<!DOCTYPE html>
            <html lang="en">
            <head>
              <title>Bootstrap Example</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
              <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
              <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
            </head>
            <body>
            <script>
            setTimeout(function(){
                window.location.reload(1);
             }, 600000);
             </script>
            <div class="jumbotron text-center">
              <h1>Elmicom</h1>
              <p>Monitoring</p> 
            </div>
              
            <div class="container"><div class="row">`;
            docs.forEach(doc => {
                html += `<div class="col-sm-4">
                            <div class="card text-white bg-${GetCard(doc)} mb-3" style="max-width: 18rem;">
                            <div class="card-header">${doc.meterId}</div>
                            <div class="card-body">
                                <h5 class="card-title">Status: ${doc.status}</h5>
                                <h5 class="card-title">Ethernet: ${doc.eth}</h5>
                                <p class="card-text">Heartbeat: ${doc.date}</p>
                            </div>
                            </div>
                        </div>`;
            });

            html += '</div></div></body></html>';
            res.send(html);
        }
    });
}



function AddMeter(req, response) {
    var db = getDb();

    console.log(req.body);
    if(req.body && (req.body.eth == 'down' || req.body.eth == 'up')) {
        sendPush(new ObjectID('5cb967737ff245517c5a7165'),req.params.meterId, 'Ethernet', req.body.status);
        sendPush(new ObjectID('5cbb0ed05d1ddc6311e0c588'),req.params.meterId, 'Ethernet', req.body.status);
    }
    if(req.body && (req.body.status == 'down' || req.body.status == 'up')) {
        sendPush(new ObjectID('5cb967737ff245517c5a7165'),req.params.meterId, 'Status', req.body.status);
        sendPush(new ObjectID('5cbb0ed05d1ddc6311e0c588'),req.params.meterId, 'Status', req.body.status);
    }

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
    function update() {}

    
    db.collection('elmicom').updateOne(
        { meterId: req.params.meterId },
        {
            $set: {
                ...req.body,
                date: new Date()
            }
        },
        { upsert: true }, function (err, result) {
            if (err) {
                console.log(err);
                return response.send({'error: ': err.message});
            }
            response.send({ "message": "saved" });
        });
}


module.exports = router;