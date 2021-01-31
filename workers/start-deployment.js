function StartDeployment(params, data, callback) {
    console.log('Starting Workflow...'+new Date().toString());
    return callback(null, data);
}

module.exports = {
    StartDeployment
}