nodeMailer = require('nodemailer')
Email = require('email-templates');
var inlineBase64 = require('nodemailer-plugin-inline-base64');

function TemplateEmail(to, template, locals) {
    let transporter = nodeMailer.createTransport({
        host: 'mail.xrc.co.za',
        port: 465,
        secure: true,
        auth: {
            user: 'admin@xrc.co.za',
            pass: 'behrens!5'
        }
    });

    transporter.use('compile', inlineBase64({cidPrefix: 'somePrefix_'}));

    const email = new Email({
        transport: transporter,
        send: true,
        preview: false,
    });

    email.send({
        template: template,
        message: {
            from: '"Admin" <admin@xrc.co.za>', // sender address
            to,
        },
        locals: locals
    }).then(() => console.log('email has been sent!'));
}

function SendEmail(to, subject, html, callback) {
    let transporter = nodeMailer.createTransport({
        host: 'mail.xrc.co.za',
        port: 465,
        secure: true,
        auth: {
            user: 'admin@xrc.co.za',
            pass: 'behrens!5'
        }
    });
    let mailOptions = {
        from: '"Admin" <admin@xrc.co.za>', // sender address
        to,
        subject,
        html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
        if (callback) return callback();
    });
}

module.exports = {
    SendEmail,
    TemplateEmail
}