import { sendError } from '../utils/response.js';

/**
 * Role-based authorization middleware.
 * Usage: authorize('admin') or authorize('admin', 'doctor')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Requires one of the following roles: ${roles.join(', ')}.`
      );
    }
    next();
  };
};

export default authorize;
