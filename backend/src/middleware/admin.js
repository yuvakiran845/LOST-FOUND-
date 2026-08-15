/**
 * adminMiddleware — protects admin-only routes.
 *
 * Strategy: "env-based admin" — no schema changes needed.
 * Any email listed in ADMIN_EMAILS (comma-separated in .env) has admin access.
 *
 * Usage: router.get('/stats', protect, adminOnly, handler)
 *
 * Example .env:
 *   ADMIN_EMAILS=admin@college.edu,yuva@campus.edu
 */
const adminOnly = (req, res, next) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  if (!adminEmails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    });
  }

  next();
};

module.exports = { adminOnly };
