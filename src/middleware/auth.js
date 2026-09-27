const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { AuthenticationError } = require('../errors/errorTypes');

const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Extract token from Authorization header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && (req.cookies.token || req.cookies.accessToken)) {
      token = req.cookies.token || req.cookies.accessToken;
    }

    if (!token) {
      return next(new AuthenticationError('Authentication required. Please log in.'));
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AuthenticationError('Session expired. Please log in again.'));
      }
      return next(new AuthenticationError('Invalid authentication token.'));
    }

    // 3. Find user by id or userId
    const query = decoded.id ? { _id: decoded.id } : { userId: decoded.userId };
    const user = await User.findOne(query);

    if (!user) {
      return next(new AuthenticationError('User belonging to this token no longer exists.'));
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Optional auth: attaches req.user if token is valid, otherwise proceeds without failing
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && (req.cookies.token || req.cookies.accessToken)) {
      token = req.cookies.token || req.cookies.accessToken;
    }

    if (!token) return next();

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const query = decoded.id ? { _id: decoded.id } : { userId: decoded.userId };
    const user = await User.findOne(query);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
};

module.exports = { protect, optionalAuth };
