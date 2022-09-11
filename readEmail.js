var imaps = require('imap-simple');
 
var config = {
    imap: {
        user: 'admin@xrc.co.za',
        password: '0VR9voYW5B',
        host: 'srv1.smartwebdns.net',
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};
 
imaps.connect(config).then(function (connection) {
 
    connection.openBox('INBOX').then(function () {
 
        var searchCriteria = ['UNSEEN',['HEADER','SUBJECT','node-imap test']];
        var fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };
 
        // retrieve only the headers of the messages
        return connection.search(searchCriteria, fetchOptions);
    }).then(function (messages) {
 
        var attachments = [];
 
        messages.forEach(function (message) {
            console.log(message);
            var parts = imaps.getParts(message.attributes.struct);
            console.log(parts);
            attachments = attachments.concat(parts.filter(function (part) {
                return part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT';
            }).map(function (part) {
                // retrieve the attachments only of the messages with attachments
                return connection.getPartData(message, part)
                    .then(function (partData) {
                        return {
                            filename: part.disposition.params.filename,
                            data: partData
                        };
                    });
            }));
        });
 
        return Promise.all(attachments);
    }).then(function (attachments) {
        console.log(attachments);
        // =>
        //    [ { filename: 'cats.jpg', data: Buffer() },
        //      { filename: 'pay-stub.pdf', data: Buffer() } ]
    });
});