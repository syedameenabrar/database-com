const isNumeric = (value) => /^-?\d+$/.test(value);

const isStatusCode = (statusCode) =>
  isNumeric(statusCode) && statusCode >= 100 && statusCode < 600;

const successResponse = (message, req, data, success) => ({
  status: "success",
  message: message,
  success,
  data,
  totals: Array.isArray(data) ? { count: data.length } : undefined,
});

const errorResponse = (message, error) => ({
  status: "error",
  message: message || "Unknown Error",
  ...(error.isOperational && error.mergeOptional
    ? { message: `${message} : ${error.optionalMessage}` }
    : { errorDetails: error.optionalMessage }),
  ...(error.dynamicMessage
    ? { message: error.dynamicMessage, errorDetails: error.data }
    : {}),
});

module.exports.send = (statusCode, message, req, res, data, success = true) => {
  statusCode = isStatusCode(statusCode) ? statusCode : 500;
  const responseData = `${statusCode}`.startsWith("2")
    ? successResponse(message, req, data, success)
    : `${statusCode}`.startsWith("4") || `${statusCode}`.startsWith("5")
    ? errorResponse(message, data)
    : undefined;

  console.log(
    `${success ? "Success" : "Error"} || ${message} || ${req.originalUrl}`
  );
  res.status(statusCode).send(responseData);
};
