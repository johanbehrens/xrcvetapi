const octopusApi = require('octopus-deploy')
const config = {
    host: 'http://octopus.ea.absolutesys.com/',
    apiKey: 'API-Y2QQMGRZA1GUIUWQUB9EZEFQ4'
}

function CreateOctoDepoyment(params, d, callback) {
    try {
        octopusApi.init(config)
    }
    catch (err) {}

    const url = '/deployments';

    const { environmentId, releaseId, formValues, machineIds, tenantId } = params
    const data = {
        EnvironmentId: environmentId,
        ExcludedMachineIds: [],
        ForcePackageDownload: false,
        ForcePackageRedeployment: false,
        FormValues: {},
        QueueTime: null,
        QueueTimeExpiry: null,
        ReleaseId: releaseId,
        SkipActions: [],
        SpecificMachineIds: [],
        TenantId: tenantId,
        UseGuidedFailure: true
    }
    if (formValues) data.formValues = formValues
    if (machineIds) data.specificMachineIds = machineIds

    octopusApi._client.post(url, data).then(d => {
        params.taskId = d.taskId;
        params.deploymentsId = d.id;
        params.channelId = d.channelId;

        var delay = new Date();
        console.log(delay);
        delay.setSeconds(delay.getSeconds() + 10);

        let job = {
            jobName: "refreshOctoDepoyment",
            delay
        };
        params.queue.push(job);

        return callback(null, params);
    });
}

module.exports = {
    CreateOctoDepoyment
}