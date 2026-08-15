const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect middleware
 *
 * Attach this to any route that requires authentication.
 * Usage:  router.get('/me', protect, getMe)
 *
 * Flow:
 *  1. Read the Authorization header
 *  2. Expect:  Bearer <token>
 *  3. Verify the token using JWT_SECRET
 *  4. Find the user in the database
 *  5. Attach user to req.user
 *  6. Call next() so the actual route handler runs
 */
const protect = async (req, res, next) => {
  let token;

  // Check if the Authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1]; // extract the token part
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. No token provided.',
    });
  }

  try {
    // Verify the token — throws if invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by the id stored inside the token payload
    // We use .select('-password') to make sure password is never attached to req.user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User no longer exists.',
      });
    }

    // Attach the user object to the request — available in all downstream handlers
    req.user = user;
    next();
  } catch (error) {
    // jwt.verify throws specific errors we can handle
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid token.',
    });
  }
};

module.exports = { protect };
