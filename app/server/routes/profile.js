import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database/db.js';
import { authenticateToken, logActivity } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const router     = express.Router();

const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (req, _file, cb) => cb(null, `avatar-${req.user.id}-${Date.now()}.jpg`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg','image/png','image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG and WebP images are allowed'));
  },
});

// POST /api/profile/avatar — upload profile image
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const intern = db.prepare('SELECT id, profile_image FROM interns WHERE user_id = ?').get(req.user.id);
    if (!intern) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(404).json({ error: 'Intern profile not found' });
    }

    // Delete old avatar if it exists
    if (intern.profile_image) {
      const oldPath = path.join(avatarsDir, intern.profile_image);
      if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath); } catch (_) {} }
    }

    // Save new filename (relative)
    db.prepare('UPDATE interns SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(req.file.filename, req.user.id);

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logActivity(req.user.id, 'PROFILE_IMAGE_UPDATED', {}, ip);

    res.json({
      message: 'Profile image updated',
      imageUrl: `/api/profile/avatar/${req.file.filename}`,
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    if (req.file?.path) { try { fs.unlinkSync(req.file.path); } catch (_) {} }
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// GET /api/profile/avatar/:filename — serve avatar image
router.get('/avatar/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(avatarsDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Image not found' });
  res.sendFile(filePath);
});

export default router;
