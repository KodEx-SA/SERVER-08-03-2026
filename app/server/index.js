import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes        from './routes/auth.js';
import adminRoutes       from './routes/admin.js';
import internRoutes      from './routes/intern.js';
import fileRoutes        from './routes/files.js';
import departmentRoutes  from './routes/departments.js';
import ticketRoutes      from './routes/tickets.js';
import profileRoutes     from './routes/profile.js';

import './database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const app        = express();
const PORT       = process.env.PORT || 3001;

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth',        authRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/intern',      internRoutes);
app.use('/api/files',       fileRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tickets',     ticketRoutes);
app.use('/api/profile',     profileRoutes);

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Error handler — before SPA catch-all
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  if (err.message === 'Invalid file type. Allowed: images, PDF, Word, Excel, TXT')
    return res.status(400).json({ error: err.message });
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  if (err.message?.startsWith('CORS:'))
    return res.status(403).json({ error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// SPA catch-all
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use((req, res) => res.sendFile(path.join(__dirname, '..', 'dist', 'index.html')));

app.listen(PORT, () => {
  console.log('=================================');
  console.log('Intern Management System Server');
  console.log('=================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log('=================================');
});

export default app;
