import express from 'express';
import db from '../database/db.js';
import { authenticateToken, requireAdmin, logActivity } from '../middleware/auth.js';

const router = express.Router();

// GET all departments (any authenticated user — interns need this for ticket form)
router.get('/', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM departments ORDER BY name ASC
    `).all();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// GET single department
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Department not found' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// POST create (admin+)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, description, headOfDepartment } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });

    const exists = db.prepare('SELECT id FROM departments WHERE name = ?').get(name);
    if (exists) return res.status(400).json({ error: 'Department name already exists' });

    const result = db.prepare(`
      INSERT INTO departments (name, description, head_of_department) VALUES (?, ?, ?)
    `).run(name, description || null, headOfDepartment || null);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'DEPARTMENT_CREATED', { departmentId: result.lastInsertRowid, name }, ip);

    res.status(201).json({
      message: 'Department created successfully',
      id: result.lastInsertRowid,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PATCH update (admin+)
router.patch('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, description, headOfDepartment, isActive } = req.body;
    const allowed = { name, description, head_of_department: headOfDepartment, is_active: isActive };
    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(allowed)) {
      if (v !== undefined) { fields.push(`${k} = ?`); values.push(v); }
    }
    if (!fields.length) return res.status(400).json({ error: 'No valid fields to update' });
    values.push(req.params.id);
    db.prepare(`UPDATE departments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
    res.json({ message: 'Department updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update department' });
  }
});

export default router;
