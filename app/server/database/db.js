import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'intern_management.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// --- FIX #3: Enable foreign key enforcement ---
// SQLite disables FK constraints by default. Without this pragma,
// deleting a user leaves orphaned interns, tasks, files, and logs.
db.pragma('foreign_keys = ON');

// Initialize tables
function initDatabase() {
  // Users table (for authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'admin', 'intern')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Interns profile table
  db.exec(`
    CREATE TABLE IF NOT EXISTS interns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      intern_code TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      sa_id TEXT UNIQUE NOT NULL,
      date_of_birth DATE NOT NULL,
      gender TEXT NOT NULL,
      citizenship TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      province TEXT,
      postal_code TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      department TEXT,
      position TEXT,
      start_date DATE,
      profile_image TEXT,
      approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Login logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      logout_time DATETIME,
      ip_address TEXT,
      device_info TEXT,
      browser TEXT,
      os TEXT,
      login_latitude REAL,
      login_longitude REAL,
      login_accuracy REAL,
      logout_latitude REAL,
      logout_longitude REAL,
      logout_accuracy REAL,
      session_token TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intern_id INTEGER NOT NULL,
      task_date DATE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      hours_spent REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (intern_id) REFERENCES interns(id) ON DELETE CASCADE
    )
  `);

  // File uploads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intern_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      category TEXT,
      description TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (intern_id) REFERENCES interns(id) ON DELETE CASCADE
    )
  `);

  // Activity logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully');
}

// --- FIX #2: Only log credentials on first creation, never on every boot ---
function createDefaultSuperAdmin() {
  const stmt = db.prepare('SELECT * FROM users WHERE role = ?');
  const existing = stmt.get('super_admin');

  if (!existing) {
    const hashedPassword = bcrypt.hashSync('Admin@123', 10);
    const insert = db.prepare(`
      INSERT INTO users (email, password, role, status) 
      VALUES (?, ?, ?, ?)
    `);
    insert.run('superadmin@internsystem.com', hashedPassword, 'super_admin', 'active');
    // Only print once — immediately after first-time creation
    console.warn('=================================================');
    console.warn('⚠  Default super admin created:');
    console.warn('   Email: superadmin@internsystem.com');
    console.warn('   Password: Admin@123');
    console.warn('   CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN');
    console.warn('=================================================');
  }
}

initDatabase();
createDefaultSuperAdmin();

export default db;
