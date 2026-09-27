const jwt = require('jsonwebtoken');
const env = require('../src/config/env');
const User = require('../src/models/User');

// Safe, request-scoped protect middleware for legacy imports
const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.replace('Bearer', '').trim();
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    let verify;
    try {
      verify = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in again.' });
    }

    const { userId, id } = verify;
    const query = id ? { _id: id } : { userId };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authentication error', error: err.message });
  }
};

module.exports = protect;