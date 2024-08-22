class AppError extends Error {
    constructor(
      statusCode,
      message,
      optionalMessage = undefined,
      mergeOptional = false
    ) {
      super(message);
  
      this.statusCode = statusCode || 500;
      this.message = message || "something went wrong";
      this.optionalMessage = optionalMessage;
      this.mergeOptional = mergeOptional;
      this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  module.exports = AppError;
  