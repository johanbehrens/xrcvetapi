
const Functions = {
    startDeployment: require('./start-deployment').StartDeployment,
    sendEmail: require('./email').SendEmail,
    download: require('./downloadFile').Download,
    downloadURL: require('./downloadURL').Download,
    toCustomXLS: require('./toCustomXLS').ToXLS,
    generateInvoice: require('./generateInvoice').Generate,
};

const Validations = {
    sendEmail: require('./email').Validation,
};

module.exports = {
    Functions,
    Validations
  }