// middleware/responseMiddleware.js
export const sendResponse = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  const success = statusCode >= 200 && statusCode < 400;

  // Base response
  const response = {
    success,
    statusCode,
    message,
  };

  // Only include data if it's not null or empty object
  if (
    data !== null &&
    !(typeof data === "object" && Object.keys(data).length === 0)
  ) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};
