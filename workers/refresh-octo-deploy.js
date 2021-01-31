const octopusApi = require('octopus-deploy')
const config = {
    host: 'http://octopus.ea.absolutesys.com/',
    apiKey: 'API-Y2QQMGRZA1GUIUWQUB9EZEFQ4'
}

function RefreshOctoDepoyment(params, data, callback) {
    var delay = new Date();
    console.log(delay);
    try {
        octopusApi.init(config)
    }
    catch (err) { }

    const url = `tasks/${params.taskId}/details`;
    octopusApi._client.get(url).then(t => {
        //console.log(t);
        var delay = new Date();
        console.log(t.task.description + ": " + t.task.state);
        console.log("Has Pending Interruptions: " + t.task.hasPendingInterruptions);
        delay.setSeconds(delay.getSeconds() + 20);

        if (t.task.state == "Canceled" || t.task.state == "Cancelling") {
            return callback('Job was cancelled: ' + t.task.description);
        }
        else if (t.task.hasPendingInterruptions) {
            const url = `tasks/${params.taskId}/raw`;
            octopusApi._client.get(url).then(inter => {
                return callback(inter);
            })
        }
        else if (t.task.state != "Success") {
            let job = {
                jobName: "refreshOctoDepoyment",
                delay
            };
            params.queue.push(job);
            return callback(null, params);
        }
        else {
            return callback(null, params);
        }
    });
}

module.exports = {
    RefreshOctoDepoyment
}