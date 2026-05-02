import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

/**
 * Verifies JWT from Authorization: Bearer <token> header.
 * Attaches decoded payload to req.user on success.
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token has expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid token.');
  }
};

export default auth;
