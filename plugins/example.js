function dumpData(data, next) {
    console.log("Logon:", data);
    return next();
}

module.exports = {method: 'logon', functions: [dumpData]};
