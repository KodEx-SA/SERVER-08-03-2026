import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database/db.js';
import { authenticateToken, requireIntern, logActivity } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: images, PDF, Word, Excel, TXT'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// --- FIX #8 helper: resolve stored filename to full path ---
function resolveFilePath(fileName) {
  return path.join(uploadsDir, fileName);
}

// Upload file
router.post('/upload', authenticateToken, requireIntern, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { category, description } = req.body;

    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);

    if (!intern) {
      // --- FIX #12: safe cleanup — nested try/catch so a missing file can't mask the real error ---
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(404).json({ error: 'Intern not found' });
    }

    // --- FIX #8: store only the filename, not the absolute path ---
    const stmt = db.prepare(`
      INSERT INTO files (intern_id, file_name, original_name, file_path, file_type, file_size, category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      intern.id,
      req.file.filename,
      req.file.originalname,
      req.file.filename,   // relative filename only
      req.file.mimetype,
      req.file.size,
      category || 'general',
      description || null
    );

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'FILE_UPLOADED', {
      fileId: result.lastInsertRowid,
      fileName: req.file.originalname,
    }, ipAddress);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: result.lastInsertRowid,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        category: category || 'general',
        uploadedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('File upload error:', error);
    // --- FIX #12: safe cleanup ---
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file
router.get('/download/:id', authenticateToken, requireIntern, (req, res) => {
  try {
    const { id } = req.params;

    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    if (!intern) return res.status(404).json({ error: 'Intern not found' });

    const fileStmt = db.prepare('SELECT * FROM files WHERE id = ? AND intern_id = ?');
    const file = fileStmt.get(id, intern.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // --- FIX #8: reconstruct full path at request time ---
    const fullPath = resolveFilePath(file.file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'FILE_DOWNLOADED', { fileId: id }, ipAddress);

    res.download(fullPath, file.original_name);

  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete file
router.delete('/:id', authenticateToken, requireIntern, (req, res) => {
  try {
    const { id } = req.params;

    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    if (!intern) return res.status(404).json({ error: 'Intern not found' });

    const fileStmt = db.prepare('SELECT * FROM files WHERE id = ? AND intern_id = ?');
    const file = fileStmt.get(id, intern.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // --- FIX #8: reconstruct full path ---
    const fullPath = resolveFilePath(file.file_path);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (_) {}
    }

    const deleteStmt = db.prepare('DELETE FROM files WHERE id = ?');
    deleteStmt.run(id);

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'FILE_DELETED', { fileId: id }, ipAddress);

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file info
router.get('/:id', authenticateToken, requireIntern, (req, res) => {
  try {
    const { id } = req.params;

    const internStmt = db.prepare('SELECT id FROM interns WHERE user_id = ?');
    const intern = internStmt.get(req.user.id);
    if (!intern) return res.status(404).json({ error: 'Intern not found' });

    const fileStmt = db.prepare(`
      SELECT id, file_name, original_name, file_type, file_size, category, description, uploaded_at
      FROM files WHERE id = ? AND intern_id = ?
    `);
    const file = fileStmt.get(id, intern.id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.json({ file });

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

export default router;
