nodeMailer = require('nodemailer')
const config = require("../config/database.js");
const fs = require('fs');

function SendEmail(params, data, mainCallback) {

    if (!params.to) return mainCallback('Please specify a to parameter');

    if(data && data.emptyPayload && params.cancelOnEmpty) return mainCallback('Canceled Email, no data');

    let transporter;

    if (data && data.error) {
        params.html += data.error.message;
    }

    let mailOptions = {
        from: config.SMTP_Sender,
        to: params.to,
        subject: params.subject,
        html: params.html
    };

    if (data && data.attachments) {
        mailOptions.attachments = data.attachments;
    }

    if (config.USE_SENDGRID) {
        mailOptions.from = {
            email: config.SMTP_Sender
        }

        if (mailOptions.attachments) {
            let attachements = [];
            mailOptions.attachments.forEach(element => {
                let bitmap = fs.readFileSync(element.path);
                let file = Buffer.from(bitmap).toString('base64');

                attachements.push({
                    content: file,
                    filename: element.filename
                });
            });
            mailOptions.attachments = attachements;
        }

        let tos = [];
        mailOptions.to.split(',').forEach(email => {
            tos.push({
                email
            });
        });
        console.log('Sending email to: ' + mailOptions.to);
        mailOptions.to = tos;

        sgMail.setApiKey(config.SMTP_Password);

        var options = {
            service: 'SendGrid',
            auth: {
                user: config.SMTP_Email,
                pass: config.SMTP_Password
            }
        }
        mainCallback(null, params);
        return sgMail.send(mailOptions, sent);

        //transporter = nodeMailer.createTransport(options);
    }
    else if (config.USE_SMTP_AUTH) {
        var options = {
            host: config.SMTP_Host,
            port: config.SMTP_Port,
            auth: {
                user: config.SMTP_Email,
                pass: config.SMTP_Password
            }
        };

        transporter = nodeMailer.createTransport(options);
    }
    else {
        var options = {
            host: config.SMTP_Host,
            port: config.SMTP_Port
        };

        transporter = nodeMailer.createTransport(options);
    }

    //mainCallback(null, params);

    transporter.sendMail(mailOptions, sent);

    function sent(error, info) {
        if (error) {
            console.log('Message error', error);
            return mainCallback(error);
        }
        else console.log('Message %s', info.response);
        return mainCallback(null, params);
    }
}

function Validation() {
    const template = [
        {
            type: 'string',
            required: true,
            name: 'to'
        }, {
            type: 'string',
            required: true,
            name: 'subject'
        }, {
            type: 'string',
            required: true,
            name: 'html'
        }
    ];

    return template;
}

module.exports = {
    SendEmail,
    Validation
}