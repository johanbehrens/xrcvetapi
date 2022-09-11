
const Functions = {
    startDeployment: require('./start-deployment').StartDeployment,
    sendEmail: require('./email').SendEmail,
    download: require('./downloadFile').Download,
    downloadURL: require('./downloadURL').Download,
    toCustomXLS: require('./toCustomXLS').ToXLS,
    generateInvoice: require('./generateInvoice').Generate,
    birthday: require('./birthday').Generate,
    enhancerWorkflow: require('./enhancer-workflow').DoWork,
    validateSubscription: require('./validateSubscription').Validate,
    stringToJSON: require('./csvToJSON').fromString,
    fileToJSON: require('./csvToJSON').fromFile,
    onebase: require('./onebase').transform,
    onebase1: require('./onebase').transform1,
    enhancerBulk: require('./enhancerBulk').DoWork,
};

const Validations = {
    sendEmail: require('./email').Validation,
};

module.exports = {
    Functions,
    Validations
  }