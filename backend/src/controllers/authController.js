const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helper ───────────────────────────────────────────────────────────────

/**
 * Generate a JWT token for a given user id.
 * The token expires in 7 days so users stay logged in across sessions.
 * The secret comes from .env — never hardcoded.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },           // payload — what we store inside the token
    process.env.JWT_SECRET,   // secret key — must match what the protect middleware uses
    { expiresIn: '7d' }       // token lifetime
  );
};

/**
 * Return a safe user object — never include the password.
 * Used consistently across all auth responses.
 */
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @access  Public
 * @desc    Register a new user
 */
const register = async (req, res) => {
  const { name, email, password } = req.body;

  // ── Input Validation ──
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  // Simple email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters.',
    });
  }

  // ── Duplicate Email Check ──
  // Check manually so we can return a user-friendly message
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  // ── Create User ──
  // Password hashing happens automatically in the User model's pre-save hook
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: safeUser(user),
  });
};

/**
 * @route   POST /api/auth/login
 * @access  Public
 * @desc    Login with email + password, return JWT
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // ── Input Validation ──
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  // ── Find User ──
  // We must explicitly select password here because the model sets select:false
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    // Use a generic message to avoid revealing which emails are registered
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  // ── Check Password ──
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  // ── Generate Token ──
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: safeUser(user),
  });
};

/**
 * @route   GET /api/auth/me
 * @access  Protected (requires valid JWT)
 * @desc    Return the currently authenticated user's profile
 */
const getMe = async (req, res) => {
  // req.user is attached by the protect middleware
  // It already has password excluded via .select('-password')
  res.json({
    success: true,
    user: safeUser(req.user),
  });
};

module.exports = { register, login, getMe };
