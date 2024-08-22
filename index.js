const upload = require("./core/cloudImage");
module.exports = { upload };

// logs
module.exports.logger = require("./utils/logs");

// database
module.exports.openDataBase = require("./utils/db")

// catchError
module.exports.catchError = require("./utils/catchError")
// responser
module.exports.responser = require("./utils/responser")

// appError
module.exports.AppError = require("./utils/appError")

// globalError
module.exports.globalError = require("./utils/globalError")

// APIFeature
module.exports.apiFeatures = require("./utils/apiFeature")

// new this.apiFeatures()
// const upload = require("./core/image");
// module.exports = upload;