const { getUserFromToken } = require('../lib/supabase');

// Middleware: require authenticated Supabase user or demo profile
async function requireAuth(req, res, next) {
  try {
    const user = await getUserFromToken(req.headers.authorization, req.headers['x-demo-role'] || req.query.role);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// Middleware: require specific role(s)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const userRole = (req.user.role || 'employee').toLowerCase();
    if (roles.map(r => r.toLowerCase()).includes(userRole) || userRole === 'admin') {
      return next();
    }
    return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
  };
}

module.exports = { requireAuth, requireRole };
