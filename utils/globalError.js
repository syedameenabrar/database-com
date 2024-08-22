// Package Imports

// Custom Imports
const responser = require("./responser");

const sendError = (err, req, res) => {
  if (err.isOperational) {
    return responser.send(err.statusCode, err.message, req, res, err);
  } else {
    // 1) Log error
    console.error("ERROR 💥", err);
    // 2) Send generic message
    return responser.send(500, "something went wrong", req, res, err);
  }
};

module.exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  let error = err;
  sendError(error, req, res);
};
