import express from 'express';
import db from '../database/db.js';
import { authenticateToken, requireIntern, logActivity } from '../middleware/auth.js';

const router = express.Router();

// Get intern profile
router.get('/profile', authenticateToken, requireIntern, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT i.*, u.email, u.created_at as user_created_at
      FROM interns i
      JOIN users u ON i.user_id = u.id
      WHERE u.id = ?
    `);
    const profile = stmt.get(req.user.id);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({ profile });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update intern profile
router.put('/profile', authenticateToken, requireIntern, (req, res) => {
  try {
    const updates = req.body;
    
    // Get intern id
    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    
    if (!intern) {
      return res.status(404).json({ error: 'Intern not found' });
    }
    
    const allowedFields = [
      'phone', 'address', 'city', 'province', 'postal_code',
      'emergency_contact_name', 'emergency_contact_phone'
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
    
    values.push(intern.id);
    
    const query = `UPDATE interns SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);
    
    // Log activity
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'PROFILE_UPDATED', { updates }, ipAddress);
    
    res.json({ message: 'Profile updated successfully' });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get my login history
router.get('/login-history', authenticateToken, requireIntern, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM login_logs 
      WHERE user_id = ? 
      ORDER BY login_time DESC 
      LIMIT 50
    `);
    const history = stmt.all(req.user.id);
    
    res.json({ history });
    
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

// Get my tasks
router.get('/tasks', authenticateToken, requireIntern, (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    
    // Get intern id
    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    
    if (!intern) {
      return res.status(404).json({ error: 'Intern not found' });
    }
    
    let query = 'SELECT * FROM tasks WHERE intern_id = ?';
    const params = [intern.id];
    
    if (date) {
      query += ' AND DATE(task_date) = DATE(?)';
      params.push(date);
    } else if (startDate && endDate) {
      query += ' AND DATE(task_date) BETWEEN DATE(?) AND DATE(?)';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY task_date DESC, created_at DESC';
    
    const stmt = db.prepare(query);
    const tasks = stmt.all(...params);
    
    res.json({ tasks });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create new task
router.post('/tasks', authenticateToken, requireIntern, (req, res) => {
  try {
    const { title, description, taskDate, hoursSpent, status } = req.body;
    
    if (!title || !taskDate) {
      return res.status(400).json({ error: 'Title and task date are required' });
    }
    
    // Get intern id
    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    
    if (!intern) {
      return res.status(404).json({ error: 'Intern not found' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO tasks (intern_id, task_date, title, description, hours_spent, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      intern.id,
      taskDate,
      title,
      description || null,
      hoursSpent || null,
      status || 'completed'
    );
    
    // Log activity
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'TASK_CREATED', { taskId: result.lastInsertRowid }, ipAddress);
    
    res.status(201).json({ 
      message: 'Task created successfully',
      taskId: result.lastInsertRowid 
    });
    
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/tasks/:id', authenticateToken, requireIntern, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Get intern id
    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    
    if (!intern) {
      return res.status(404).json({ error: 'Intern not found' });
    }
    
    // Verify task belongs to this intern
    const taskStmt = db.prepare('SELECT * FROM tasks WHERE id = ? AND intern_id = ?');
    const task = taskStmt.get(id, intern.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const allowedFields = ['title', 'description', 'hours_spent', 'status'];
    
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
    
    const query = `UPDATE tasks SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);
    
    // Log activity
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'TASK_UPDATED', { taskId: id, updates }, ipAddress);
    
    res.json({ message: 'Task updated successfully' });
    
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/tasks/:id', authenticateToken, requireIntern, (req, res) => {
  try {
    const { id } = req.params;
    
    // Get intern id
    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    
    if (!intern) {
      return res.status(404).json({ error: 'Intern not found' });
    }
    
    // Verify task belongs to this intern
    const taskStmt = db.prepare('SELECT * FROM tasks WHERE id = ? AND intern_id = ?');
    const task = taskStmt.get(id, intern.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
    
    // Log activity
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'TASK_DELETED', { taskId: id }, ipAddress);
    
    res.json({ message: 'Task deleted successfully' });
    
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get my files
router.get('/files', authenticateToken, requireIntern, (req, res) => {
  try {
    // Get intern id
    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    
    if (!intern) {
      return res.status(404).json({ error: 'Intern not found' });
    }
    
    const stmt = db.prepare(`
      SELECT id, file_name, original_name, file_type, file_size, category, description, uploaded_at
      FROM files 
      WHERE intern_id = ? 
      ORDER BY uploaded_at DESC
    `);
    const files = stmt.all(intern.id);
    
    res.json({ files });
    
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

export default router;
