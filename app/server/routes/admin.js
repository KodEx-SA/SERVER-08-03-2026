import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { authenticateToken, requireAdmin, requireSuperAdmin, logActivity } from '../middleware/auth.js';

const router = express.Router();

// Get all interns (with filters)
router.get('/interns', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status, department, search } = req.query;

    let query = `
      SELECT i.*, u.email, u.status as user_status, u.created_at as user_created_at,
             approver.first_name as approver_first_name, approver.last_name as approver_last_name
      FROM interns i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN users approver_user ON i.approved_by = approver_user.id
      LEFT JOIN interns approver ON approver_user.id = approver.user_id
      WHERE 1=1
    `;

    const params = [];

    if (status) { query += ' AND i.approval_status = ?'; params.push(status); }
    if (department) { query += ' AND i.department = ?'; params.push(department); }
    if (search) {
      query += ` AND (i.first_name LIKE ? OR i.last_name LIKE ? OR i.intern_code LIKE ? OR u.email LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY i.created_at DESC';

    const interns = db.prepare(query).all(...params);
    res.json({ interns });

  } catch (error) {
    console.error('Get interns error:', error);
    res.status(500).json({ error: 'Failed to fetch interns' });
  }
});

// Get single intern details
router.get('/interns/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    const intern = db.prepare(`
      SELECT i.*, u.email, u.status as user_status, u.created_at as user_created_at
      FROM interns i JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `).get(id);

    if (!intern) return res.status(404).json({ error: 'Intern not found' });

    const loginLogs = db.prepare(`
      SELECT * FROM login_logs WHERE user_id = ? ORDER BY login_time DESC LIMIT 50
    `).all(intern.user_id);

    const tasks = db.prepare(`
      SELECT * FROM tasks WHERE intern_id = ? ORDER BY task_date DESC LIMIT 50
    `).all(id);

    const files = db.prepare(`
      SELECT id, file_name, original_name, file_type, file_size, category, description, uploaded_at
      FROM files WHERE intern_id = ? ORDER BY uploaded_at DESC
    `).all(id);

    res.json({ intern, loginLogs, tasks, files });

  } catch (error) {
    console.error('Get intern details error:', error);
    res.status(500).json({ error: 'Failed to fetch intern details' });
  }
});

// Approve intern
router.post('/interns/:id/approve', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const intern = db.prepare('SELECT * FROM interns WHERE id = ?').get(id);

    if (!intern) return res.status(404).json({ error: 'Intern not found' });
    if (intern.approval_status === 'approved') {
      return res.status(400).json({ error: 'Intern is already approved' });
    }

    db.prepare(`
      UPDATE interns SET approval_status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, id);

    db.prepare('UPDATE users SET status = ? WHERE id = ?').run('active', intern.user_id);

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'INTERN_APPROVED', { internId: id }, ipAddress);

    res.json({ message: 'Intern approved successfully' });

  } catch (error) {
    console.error('Approve intern error:', error);
    res.status(500).json({ error: 'Failed to approve intern' });
  }
});

// Reject intern
router.post('/interns/:id/reject', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const intern = db.prepare('SELECT * FROM interns WHERE id = ?').get(id);
    if (!intern) return res.status(404).json({ error: 'Intern not found' });

    db.prepare(`
      UPDATE interns SET approval_status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, id);

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'INTERN_REJECTED', { internId: id }, ipAddress);

    res.json({ message: 'Intern rejected' });

  } catch (error) {
    console.error('Reject intern error:', error);
    res.status(500).json({ error: 'Failed to reject intern' });
  }
});

// Update intern
router.put('/interns/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'first_name', 'last_name', 'phone', 'address', 'city',
      'province', 'postal_code', 'emergency_contact_name',
      'emergency_contact_phone', 'department', 'position',
    ];

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    db.prepare(`UPDATE interns SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

    // --- FIX #13: log only field names, not PII values ---
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'INTERN_UPDATED', {
      internId: id,
      fieldsChanged: fields.map(f => f.split(' ')[0]),
    }, ipAddress);

    res.json({ message: 'Intern updated successfully' });

  } catch (error) {
    console.error('Update intern error:', error);
    res.status(500).json({ error: 'Failed to update intern' });
  }
});

// Create admin (super admin only)
router.post('/admins', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (email, password, role, status) VALUES (?, ?, 'admin', 'active')
    `).run(email, hashedPassword);

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'ADMIN_CREATED', { adminId: result.lastInsertRowid, email }, ipAddress);

    res.status(201).json({ message: 'Admin created successfully', adminId: result.lastInsertRowid });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Get all admins
router.get('/admins', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const admins = db.prepare(`
      SELECT id, email, role, status, created_at
      FROM users WHERE role IN ('admin', 'super_admin')
      ORDER BY created_at DESC
    `).all();
    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Get dashboard statistics
router.get('/dashboard-stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalInterns = db.prepare('SELECT COUNT(*) as count FROM interns').get().count;
    const pendingApprovals = db.prepare(`SELECT COUNT(*) as count FROM interns WHERE approval_status = 'pending'`).get().count;
    const approvedInterns = db.prepare(`SELECT COUNT(*) as count FROM interns WHERE approval_status = 'approved'`).get().count;
    const todayLogins = db.prepare(`SELECT COUNT(*) as count FROM login_logs WHERE DATE(login_time) = DATE('now')`).get().count;
    const tasksToday = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE DATE(task_date) = DATE('now')`).get().count;

    const recentActivities = db.prepare(`
      SELECT al.*, u.email, i.first_name, i.last_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN interns i ON u.id = i.user_id
      ORDER BY al.created_at DESC LIMIT 20
    `).all();

    res.json({
      stats: { totalInterns, pendingApprovals, approvedInterns, todayLogins, tasksToday },
      recentActivities,
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
