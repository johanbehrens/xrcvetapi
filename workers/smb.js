const helper = require('../helpers/helper');
var SMB2 = require('smb2');
const mustache = require('mustache');
const fs = require('fs');
var moment = require('moment');

function getFile(params, data, callback) {

    var smb2Client = new SMB2({
        share: params.share
        , domain: params.domain
        , username: params.username
        , password: params.password
    });

    params.dateNow = moment().format('YYYY-MM-DD');
    var filepath = mustache.render(params.filepath, params);
    smb2Client.readFile(filepath, function (err, data) {
        if (err) return callback(err, null);
        
        let date = new Date();
        let tempFile = './temp/' + '_smb_' + date;
        fs.writeFileSync(tempFile, data)

        if (!params.attachments) {
            params.attachments = [];
        }

        params.fileName = mustache.render(params.fileName, params);

        params.attachments.push({
            filename: params.fileName,
            path: tempFile
        });

        return callback(null, params);
    });
}

function Validation() {
    const template = [
        {
            type: 'string',
            required: true,
            name: 'filepath'
        },
        {
            type: 'string',
            required: true,
            name: 'fileName'
        },
        {
            type: 'string',
            required: true,
            name: 'share'
        },
        {
            type: 'string',
            required: true,
            name: 'domain'
        },
        {
            type: 'string',
            required: true,
            name: 'username'
        },
        {
            type: 'string',
            required: true,
            name: 'password'
        }
    ];

    return template;
}

module.exports = {
    getFile,
    Validation
}