nodeMailer = require('nodemailer')

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
    SendEmail
}