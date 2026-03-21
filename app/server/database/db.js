import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const dbPath     = path.join(__dirname, 'intern_management.db');
const db         = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // ── Users ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL CHECK(role IN ('super_admin','admin','intern')),
      status     TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Interns ────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS interns (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                  INTEGER UNIQUE NOT NULL,
      intern_code              TEXT UNIQUE NOT NULL,
      first_name               TEXT NOT NULL,
      last_name                TEXT NOT NULL,
      sa_id                    TEXT UNIQUE NOT NULL,
      date_of_birth            DATE NOT NULL,
      gender                   TEXT NOT NULL,
      citizenship              TEXT NOT NULL,
      phone                    TEXT,
      address                  TEXT,
      city                     TEXT,
      province                 TEXT,
      postal_code              TEXT,
      emergency_contact_name   TEXT,
      emergency_contact_phone  TEXT,
      department               TEXT,
      position                 TEXT,
      start_date               DATE,
      profile_image            TEXT,
      approval_status          TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending','approved','rejected')),
      approved_by              INTEGER,
      approved_at              DATETIME,
      created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // ── Login logs ─────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL,
      login_time        DATETIME DEFAULT CURRENT_TIMESTAMP,
      logout_time       DATETIME,
      ip_address        TEXT,
      device_info       TEXT,
      browser           TEXT,
      os                TEXT,
      login_latitude    REAL,
      login_longitude   REAL,
      login_accuracy    REAL,
      logout_latitude   REAL,
      logout_longitude  REAL,
      logout_accuracy   REAL,
      session_token     TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── Tasks ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      intern_id   INTEGER NOT NULL,
      task_date   DATE NOT NULL,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT DEFAULT 'completed' CHECK(status IN ('pending','in_progress','completed','cancelled')),
      hours_spent REAL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (intern_id) REFERENCES interns(id) ON DELETE CASCADE
    )
  `);

  // ── Files ──────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      intern_id     INTEGER NOT NULL,
      file_name     TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path     TEXT NOT NULL,
      file_type     TEXT,
      file_size     INTEGER,
      category      TEXT,
      description   TEXT,
      uploaded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (intern_id) REFERENCES interns(id) ON DELETE CASCADE
    )
  `);

  // ── Activity logs ──────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      action     TEXT NOT NULL,
      details    TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── Departments (new) ──────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name                TEXT UNIQUE NOT NULL,
      description         TEXT,
      head_of_department  TEXT,
      is_active           INTEGER DEFAULT 1,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Tickets (new) ──────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number    TEXT UNIQUE NOT NULL,
      title            TEXT NOT NULL,
      description      TEXT NOT NULL,
      status           TEXT DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed','cancelled')),
      priority         TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      category         TEXT,
      created_by       INTEGER NOT NULL,
      assigned_to      INTEGER,
      department_id    INTEGER,
      resolution_notes TEXT,
      resolved_at      DATETIME,
      closed_at        DATETIME,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by)    REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to)   REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    )
  `);

  console.log('Database initialized successfully');
}

function createDefaultSuperAdmin() {
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('super_admin');
  if (!existing) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    db.prepare(`INSERT INTO users (email,password,role,status) VALUES (?,?,?,?)`).run(
      'superadmin@internsystem.com', hash, 'super_admin', 'active'
    );
    console.warn('=================================================');
    console.warn('⚠  Default super admin created:');
    console.warn('   Email: superadmin@internsystem.com');
    console.warn('   Password: Admin@123');
    console.warn('   CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN');
    console.warn('=================================================');
  }
}

function seedDepartments() {
  const count = db.prepare('SELECT COUNT(*) as c FROM departments').get().c;
  if (count > 0) return;
  const insert = db.prepare(`INSERT INTO departments (name,description,head_of_department) VALUES (?,?,?)`);
  [
    ['IT Support',        'Hardware, software and networking support',         'Senior Technician'],
    ['CSDI Programme',    'Computer literacy education for schools',           'Programme Manager'],
    ['Digital Marketing', 'Website development and digital presence',          'Marketing Lead'],
    ['Finance',           'Invoicing, payments and financial records',         'Finance Manager'],
    ['Human Resources',   'Recruitment, onboarding and staff welfare',         'HR Manager'],
    ['Operations',        'Logistics and day-to-day operations',               'Operations Lead'],
  ].forEach(([n, d, h]) => insert.run(n, d, h));
}

initDatabase();
createDefaultSuperAdmin();
seedDepartments();

export default db;
