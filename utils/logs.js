module.exports.info = function (message) {
    console.log("INFO: ", message);
};

module.exports.error = function (message, error) {
    console.log("ERROR: " + message);
    console.log(error);
};

module.exports.data = function (message, data) {
    console.log("DATA: ", message);
    console.log(data);
};

module.exports.success = function (message, data) {
    console.log("SUCCESS: " + message);
    console.log(data);
};
