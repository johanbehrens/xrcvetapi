const { URLSearchParams } = require('url');
var moment = require('moment');
const async = require('async');
const fs = require('fs');
const fetch = require('node-fetch');
const config = require("../config/database.js");
nodeMailer = require('nodemailer')

function Generate(params, data, callback) {

    if (!data.payload) return callback('No payload received');

    async.forEachSeries(data.payload, function (element, next) {

        if (!moment(element.dateOfBirth, ["MM/DD/YYYY", "YYYY-MM-DD"]).isValid()) return next();

        if (moment().format('MM-DD') == moment(element.dateOfBirth, ["MM/DD/YYYY", "YYYY-MM-DD"]).format('MM-DD')) {
            let p = new URLSearchParams();
            p.append('name', element.name);

            console.log(element);
            const file = fs.createWriteStream('birthday.pdf');

            fetch(params.url, { method: 'post', body: p }).then(response => {
                response.body.pipe(file);

                file.on('finish', function () {
                    file.close(done);
                });
            }).catch(err => next());

            function done() {
                let mailOptions = {
                    from: config.SMTP_Sender,
                    to: element.email,
                    subject: params.subject,
                    html: params.html
                };

                mailOptions.attachments = [{
                    filename: 'birthday.pdf',
                    path: 'birthday.pdf'
                }];

                var options = {
                    host: config.SMTP_Host,
                    port: config.SMTP_Port,
                    auth: {
                        user: config.SMTP_Email,
                        pass: config.SMTP_Password
                    }
                };

                let transporter = nodeMailer.createTransport(options);
                transporter.sendMail(mailOptions, sent);

                function sent(error, info) {
                    if (error) {
                        next();
                    }
                    else console.log('Message %s', info.response);
                    return next();
                }
            }
        }
        else next();
    }, function (err) {
        if (err) return callback(err);
        else return callback(null, data);
    });
}

module.exports = {
    Generate
}