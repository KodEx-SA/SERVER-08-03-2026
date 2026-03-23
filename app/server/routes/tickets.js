import express from 'express';
import db from '../database/db.js';
import { authenticateToken, requireAdmin, logActivity } from '../middleware/auth.js';
import { notifyTicketUpdated } from '../utils/emailService.js';

const router = express.Router();

// Helper — join ticket row with user + department info
function enrichTicket(row) {
  if (!row) return null;
  const creator = db.prepare(`
    SELECT u.id, u.email, i.first_name, i.last_name
    FROM users u LEFT JOIN interns i ON u.id = i.user_id
    WHERE u.id = ?
  `).get(row.created_by);

  const assignee = row.assigned_to ? db.prepare(`
    SELECT u.id, u.email, i.first_name, i.last_name
    FROM users u LEFT JOIN interns i ON u.id = i.user_id
    WHERE u.id = ?
  `).get(row.assigned_to) : null;

  const dept = row.department_id
    ? db.prepare('SELECT * FROM departments WHERE id = ?').get(row.department_id)
    : null;

  return {
    ...row,
    createdBy: creator,
    assignedTo: assignee,
    department: dept,
  };
}

function generateTicketNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TKT-${ts}-${rand}`;
}

// GET all tickets
// Admins see all; interns see only their own
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, priority, department_id } = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    // Interns can only see tickets they created
    if (req.user.role === 'intern') {
      query += ' AND created_by = ?';
      params.push(req.user.id);
    }

    if (status)        { query += ' AND status = ?';        params.push(status); }
    if (priority)      { query += ' AND priority = ?';      params.push(priority); }
    if (department_id) { query += ' AND department_id = ?'; params.push(department_id); }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(enrichTicket));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET single ticket
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });

    // Interns can only view their own tickets
    if (req.user.role === 'intern' && row.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(enrichTicket(row));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST create ticket (any authenticated user)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, description, priority, departmentId, category } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const ticketNumber = generateTicketNumber();
    const result = db.prepare(`
      INSERT INTO tickets (ticket_number, title, description, priority, category, created_by, department_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticketNumber,
      title,
      description,
      priority || 'medium',
      category || null,
      req.user.id,
      departmentId || null,
    );

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'TICKET_CREATED', { ticketId: result.lastInsertRowid, ticketNumber }, ip);

    const created = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(enrichTicket(created));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PATCH update ticket
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });

    // Interns can only update tickets they created, and only limited fields
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (!isAdmin && row.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const adminFields    = ['status', 'assigned_to', 'resolution_notes', 'priority'];
    const internFields   = ['title', 'description', 'priority', 'category'];
    const allowed        = isAdmin ? [...adminFields, ...internFields] : internFields;

    const { title, description, status, priority, category, assignedToId, resolutionNotes } = req.body;
    const map = { title, description, status, priority, category,
                  assigned_to: assignedToId, resolution_notes: resolutionNotes };

    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined && allowed.includes(k)) { fields.push(`${k} = ?`); values.push(v); }
    }

    // Auto-set timestamps on status transitions
    if (status === 'resolved' && row.status !== 'resolved') {
      fields.push('resolved_at = CURRENT_TIMESTAMP');
    }
    if (status === 'closed' && row.status !== 'closed') {
      fields.push('closed_at = CURRENT_TIMESTAMP');
    }

    if (!fields.length) return res.status(400).json({ error: 'No valid fields to update' });

    values.push(req.params.id);
    db.prepare(`UPDATE tickets SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'TICKET_UPDATED', { ticketId: req.params.id, fieldsChanged: fields.map(f => f.split(' ')[0]) }, ip);

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    const enriched = enrichTicket(updated);

    // Notify ticket creator if status changed and they're an intern
    if (req.body.status && req.body.status !== row.status) {
      try {
        const creator = db.prepare('SELECT u.email, i.first_name FROM users u LEFT JOIN interns i ON u.id = i.user_id WHERE u.id = ?').get(row.created_by);
        if (creator?.email && creator.first_name) {
          await notifyTicketUpdated({
            internEmail: creator.email,
            firstName: creator.first_name,
            ticketNumber: updated.ticket_number,
            ticketTitle: updated.title,
            newStatus: req.body.status,
            resolutionNotes: req.body.resolutionNotes ?? updated.resolution_notes,
          });
        }
      } catch (emailErr) { console.warn('Ticket email failed:', emailErr.message); }
    }

    res.json(enriched);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// DELETE (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const row = db.prepare('SELECT id FROM tickets WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
    res.json({ message: 'Ticket deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

export default router;
