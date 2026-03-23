import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';
import SAIdValidator from '../utils/saIdValidator.js';
import { generateToken, authenticateToken, logActivity } from '../middleware/auth.js';
import { notifyAdminNewIntern } from '../utils/emailService.js';

const router = express.Router();

// --- FIX #5: Rate limiter for login endpoint ---
// Prevents brute-force attacks. Using a simple in-memory store here;
// replace with redis-backed store (rate-limit-redis) for multi-process deployments.
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 10;

function loginRateLimiter(req, res, next) {
  const key = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, windowStart: now };

  if (now - record.windowStart > LOGIN_WINDOW_MS) {
    // Window expired — reset
    record.count = 0;
    record.windowStart = now;
  }

  record.count++;
  loginAttempts.set(key, record);

  if (record.count > LOGIN_MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((LOGIN_WINDOW_MS - (now - record.windowStart)) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: `Too many login attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
    });
  }

  next();
}

// --- FIX #6: Password strength validation ---
function validatePassword(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

// --- FIX #7: Email format validation ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Register new intern
router.post('/register', async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, saId,
      phone, address, city, province, postalCode,
      emergencyContactName, emergencyContactPhone,
      department, position,
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !saId) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ error: pwError });

    // Validate SA ID
    const saIdValidation = SAIdValidator.extractAll(saId);
    if (!saIdValidation.valid) {
      return res.status(400).json({ error: saIdValidation.error });
    }

    // Check if email already exists
    const emailCheck = db.prepare('SELECT id FROM users WHERE email = ?');
    if (emailCheck.get(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if SA ID already exists
    const saIdCheck = db.prepare('SELECT id FROM interns WHERE sa_id = ?');
    if (saIdCheck.get(saId)) {
      return res.status(400).json({ error: 'SA ID already registered' });
    }

    // Generate unique intern code
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const internCode = `INT-${year}-${randomNum}`;

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    const insertUser = db.prepare(`
      INSERT INTO users (email, password, role, status)
      VALUES (?, ?, 'intern', 'pending')
    `);

    const insertIntern = db.prepare(`
      INSERT INTO interns (
        user_id, intern_code, first_name, last_name, sa_id,
        date_of_birth, gender, citizenship, phone, address,
        city, province, postal_code, emergency_contact_name,
        emergency_contact_phone, department, position, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = db.transaction(() => {
      const userResult = insertUser.run(email, hashedPassword);
      const internResult = insertIntern.run(
        userResult.lastInsertRowid, internCode,
        firstName, lastName, saIdValidation.idNumber,
        saIdValidation.dateOfBirth, saIdValidation.gender,
        saIdValidation.citizenship,
        phone || null, address || null, city || null,
        province || null, postalCode || null,
        emergencyContactName || null, emergencyContactPhone || null,
        department || null, position || null
      );
      return { userId: userResult.lastInsertRowid, internId: internResult.lastInsertRowid };
    })();

    // Notify all admins about the new registration
    try {
      const admins = db.prepare("SELECT email FROM users WHERE role IN ('admin','super_admin') AND status = 'active'").all();
      for (const admin of admins) {
        await notifyAdminNewIntern({
          adminEmail: admin.email,
          internName: `${firstName} ${lastName}`,
          internEmail: email,
          internCode,
        });
      }
    } catch (emailErr) {
      console.warn('Failed to send admin notification email:', emailErr.message);
    }

    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      internCode,
      extractedInfo: {
        dateOfBirth: saIdValidation.dateOfBirth,
        gender: saIdValidation.gender,
        citizenship: saIdValidation.citizenship,
        age: saIdValidation.age,
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login (rate limited)
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password, latitude, longitude, accuracy, deviceInfo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const userStmt = db.prepare(`
      SELECT u.*, i.id as intern_id, i.approval_status, i.intern_code
      FROM users u
      LEFT JOIN interns i ON u.id = i.user_id
      WHERE u.email = ?
    `);
    const user = userStmt.get(email);

    // Use constant-time comparison even on missing user to avoid timing attacks
    if (!user) {
      bcrypt.compareSync(password, '$2a$10$invalidhashpaddingtoconstanttime');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive. Please contact administrator.' });
    }

    if (user.role === 'intern' && user.approval_status !== 'approved') {
      return res.status(403).json({
        error: user.approval_status === 'pending'
          ? 'Your account is pending approval. Please wait for admin confirmation.'
          : 'Your registration has been rejected. Please contact administrator.',
      });
    }

    const sessionToken = uuidv4();
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const loginLogStmt = db.prepare(`
      INSERT INTO login_logs (
        user_id, ip_address, device_info, browser, os,
        login_latitude, login_longitude, login_accuracy, session_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Safely handle deviceInfo — it may be an object, string, or undefined
    const deviceInfoStr = deviceInfo
      ? (typeof deviceInfo === 'object' ? JSON.stringify(deviceInfo) : String(deviceInfo))
      : userAgent;
    const browserStr = (typeof deviceInfo === 'object' && deviceInfo !== null)
      ? (deviceInfo.browser || 'Unknown')
      : 'Unknown';
    const osStr = (typeof deviceInfo === 'object' && deviceInfo !== null)
      ? (deviceInfo.os || 'Unknown')
      : 'Unknown';

    loginLogStmt.run(
      user.id,
      ipAddress ?? null,
      deviceInfoStr,
      browserStr,
      osStr,
      latitude ?? null,
      longitude ?? null,
      accuracy ?? null,
      sessionToken
    );

    const token = generateToken(user);
    logActivity(user.id, 'LOGIN', { ipAddress }, ipAddress);

    // Clear rate limit record on successful login
    const key = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    loginAttempts.delete(key);

    res.json({
      message: 'Login successful',
      token,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        internId: user.intern_id,
        internCode: user.intern_code,
        approvalStatus: user.approval_status,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { sessionToken, latitude, longitude, accuracy } = req.body;

    const logoutStmt = db.prepare(`
      UPDATE login_logs
      SET logout_time = CURRENT_TIMESTAMP,
          logout_latitude = ?,
          logout_longitude = ?,
          logout_accuracy = ?
      WHERE session_token = ? AND user_id = ?
    `);
    logoutStmt.run(latitude || null, longitude || null, accuracy || null, sessionToken, req.user.id);

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'LOGOUT', { sessionToken }, ipAddress);

    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed. Please try again.' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  try {
    const userStmt = db.prepare(`
      SELECT u.id, u.email, u.role, u.status, u.created_at,
             i.id as intern_id, i.intern_code, i.first_name, i.last_name,
             i.sa_id, i.date_of_birth, i.gender, i.citizenship,
             i.phone, i.address, i.city, i.province, i.postal_code,
             i.emergency_contact_name, i.emergency_contact_phone,
             i.department, i.position, i.profile_image, i.approval_status
      FROM users u
      LEFT JOIN interns i ON u.id = i.user_id
      WHERE u.id = ?
    `);
    const user = userStmt.get(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide current and new password' });
    }

    // Validate new password strength
    const pwError = validatePassword(newPassword);
    if (pwError) return res.status(400).json({ error: pwError });

    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = userStmt.get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    updateStmt.run(hashedPassword, req.user.id);

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'PASSWORD_CHANGE', {}, ipAddress);

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;