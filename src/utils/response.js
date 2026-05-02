/**
 * Send a successful JSON response
 */
export const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * Send an error JSON response
 */
export const sendError = (res, statusCode = 500, message = 'An error occurred') => {
  return res.status(statusCode).json({ success: false, message });
};
