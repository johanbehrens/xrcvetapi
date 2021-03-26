const fs = require('fs');
const fetch = require('node-fetch');

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

function Download(params, data, callback) {

    let preFix = './temp/' + uuidv4();
    const file = fs.createWriteStream(preFix +'_' +params.fileName);

    let body;
    if (params.body) body = data[params.body]
    else {
        body = new URLSearchParams();
        Object.keys(data).forEach((key) => {
            body.append(key, data[key]);
        });
    }

    let options = {
        method: params.method
    }
    if(params.method == 'POST') options.body = body;

    fetch(params.url, options)
        .then(response => {
            response.body.pipe(file);

            file.on('finish', function () {
                if (!data.attachments) {
                    data.attachments = [];
                }
                data.attachments.push({
                    filename: params.fileName,
                    path: preFix +'_' +params.fileName
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