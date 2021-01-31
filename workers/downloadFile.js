const fs = require('fs');
const fetch = require('node-fetch');

function Download(params, data, callback) {
    const file = fs.createWriteStream(params.fileName);

    fetch(params.url, { method: params.method, body: data[params.body] })
        .then(response => {
            response.body.pipe(file);

            file.on('finish', function () {
                if (!data.attachments) {
                    data.attachments = [];
                }
                data.attachments.push({
                    filename: params.fileName,
                    path: params.fileName
                });
                file.close(done);
            });
        })

    .catch(err => callback(err.message));

    function done() {
        callback(null, data);
    }
}

module.exports = {
    Download
}