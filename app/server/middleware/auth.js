import jwt from 'jsonwebtoken';
import db from '../database/db.js';

// --- FIX #1: JWT_SECRET must be set via environment variable ---
// Crash on startup if the secret is missing — a hardcoded fallback
// lets anyone with the source code forge tokens for any role.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '2h' } // Reduced from 24h to limit exposure window
  );
};

// Verify JWT token middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// Check if user is super admin
export const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super admin required.' });
  }
  next();
};

// Check if user is admin or super admin
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Admin required.' });
  }
  next();
};

// Check if user is intern
export const requireIntern = (req, res, next) => {
  if (req.user.role !== 'intern') {
    return res.status(403).json({ error: 'Access denied. Intern access required.' });
  }
  next();
};

// Log activity — log only metadata, never raw PII values
export const logActivity = (userId, action, details, ipAddress) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO activity_logs (user_id, action, details, ip_address)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, action, JSON.stringify(details), ipAddress);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export { JWT_SECRET };
