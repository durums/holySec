const Database = require('better-sqlite3')
const path     = require('path')

const DB_PATH = path.join(__dirname, 'holysec.db')
const db      = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS kv (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'Pentester',
    title      TEXT DEFAULT '',
    skills     TEXT DEFAULT '[]',
    status     TEXT DEFAULT 'Active',
    initials   TEXT DEFAULT '',
    color      TEXT DEFAULT 'cyan',
    nickname   TEXT DEFAULT '',
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS clients (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    industry    TEXT DEFAULT '',
    status      TEXT DEFAULT 'Active',
    scope_type  TEXT DEFAULT 'Web',
    criticality TEXT DEFAULT 'MEDIUM',
    next_test   TEXT DEFAULT '',
    contact     TEXT DEFAULT '{}',
    contract    TEXT DEFAULT '{}',
    scope       TEXT DEFAULT '{}',
    lat         REAL,
    lng         REAL,
    city        TEXT DEFAULT '',
    created_at  INTEGER DEFAULT (unixepoch()),
    updated_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS findings (
    id            TEXT PRIMARY KEY,
    client_id     TEXT REFERENCES clients(id) ON DELETE SET NULL,
    engagement_id TEXT REFERENCES engagements(id) ON DELETE SET NULL,
    discovered_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    title         TEXT NOT NULL,
    cve           TEXT,
    cvss          REAL DEFAULT 0,
    severity      TEXT DEFAULT 'MEDIUM',
    category      TEXT DEFAULT 'Other',
    status        TEXT DEFAULT 'Open',
    date          TEXT DEFAULT '',
    description   TEXT DEFAULT '',
    remediation   TEXT DEFAULT '',
    created_at    INTEGER DEFAULT (unixepoch()),
    updated_at    INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS engagements (
    id          TEXT PRIMARY KEY,
    client_id   TEXT REFERENCES clients(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    type        TEXT DEFAULT 'Web',
    start       TEXT DEFAULT '',
    end         TEXT DEFAULT '',
    status      TEXT DEFAULT 'Planned',
    phases      TEXT DEFAULT '[]',
    lead        TEXT DEFAULT '',
    assigned_to TEXT DEFAULT '[]',
    created_at  INTEGER DEFAULT (unixepoch()),
    updated_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS reports (
    id            TEXT PRIMARY KEY,
    client_id     TEXT REFERENCES clients(id) ON DELETE SET NULL,
    engagement_id TEXT REFERENCES engagements(id) ON DELETE SET NULL,
    title         TEXT NOT NULL,
    date          TEXT DEFAULT '',
    type          TEXT DEFAULT 'Technical Report',
    status        TEXT DEFAULT 'Draft',
    created_at    INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id         TEXT PRIMARY KEY,
    user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_name  TEXT DEFAULT '',
    date       TEXT DEFAULT '',
    start      TEXT DEFAULT '',
    end        TEXT DEFAULT '',
    duration   INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS eng_groups (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    description   TEXT DEFAULT '',
    member_ids    TEXT DEFAULT '[]',
    engagement_id TEXT,
    color         TEXT DEFAULT 'cyan',
    created_at    INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id         TEXT PRIMARY KEY,
    user_id    TEXT DEFAULT '',
    user_name  TEXT DEFAULT '',
    role       TEXT DEFAULT '',
    action     TEXT DEFAULT '',
    details    TEXT DEFAULT '',
    category   TEXT DEFAULT '',
    ip         TEXT DEFAULT '',
    timestamp  TEXT DEFAULT '',
    created_at INTEGER DEFAULT (unixepoch())
  );
`)

// ─── HILFSFUNKTIONEN ──────────────────────────────────────────────────────────

function j(val) { return JSON.stringify(val) }
function p(val) { try { return JSON.parse(val) } catch { return val } }

function parseUser(row) {
  if (!row) return null
  return { ...row, skills: p(row.skills) }
}

function parseClient(row) {
  if (!row) return null
  return { ...row, contact: p(row.contact), contract: p(row.contract), scope: p(row.scope),
    scopeType: row.scope_type, nextTest: row.next_test }
}

function parseFinding(row) {
  if (!row) return null
  return { ...row, clientId: row.client_id, engagementId: row.engagement_id }
}

function parseEngagement(row) {
  if (!row) return null
  return { ...row, clientId: row.client_id, phases: p(row.phases), assignedTo: p(row.assigned_to) }
}

function parseReport(row) {
  if (!row) return null
  return { ...row, clientId: row.client_id, engagementId: row.engagement_id }
}

function parseEngGroup(row) {
  if (!row) return null
  return { ...row, memberIds: p(row.member_ids), engagementId: row.engagement_id }
}

// ─── KV (JWT-Secret, Legacy) ──────────────────────────────────────────────────

const kv = {
  get: db.prepare('SELECT value FROM kv WHERE key = ?'),
  set: db.prepare(`
    INSERT INTO kv (key, value, updated_at) VALUES (?, ?, unixepoch())
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()
  `),
}

// ─── USERS ────────────────────────────────────────────────────────────────────

const users = {
  all: () => db.prepare('SELECT * FROM users ORDER BY created_at').all().map(parseUser),
  byId: (id) => parseUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)),
  byEmail: (email) => parseUser(db.prepare('SELECT * FROM users WHERE email = ?').get(email)),
  insert: db.prepare(`
    INSERT INTO users (id, name, email, password, role, title, skills, status, initials, color, nickname)
    VALUES (@id, @name, @email, @password, @role, @title, @skills, @status, @initials, @color, @nickname)
  `),
  update: db.prepare(`
    UPDATE users SET name=@name, email=@email, role=@role, title=@title,
    skills=@skills, status=@status, initials=@initials, color=@color, nickname=@nickname
    WHERE id=@id
  `),
  updatePassword: db.prepare('UPDATE users SET password=@password WHERE id=@id'),
  delete: db.prepare('DELETE FROM users WHERE id = ?'),
  count: () => db.prepare('SELECT COUNT(*) as n FROM users').get().n,
}

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

const clients = {
  all: () => db.prepare('SELECT * FROM clients ORDER BY created_at').all().map(parseClient),
  byId: (id) => parseClient(db.prepare('SELECT * FROM clients WHERE id = ?').get(id)),
  insert: db.prepare(`
    INSERT INTO clients (id, name, industry, status, scope_type, criticality, next_test,
    contact, contract, scope, lat, lng, city)
    VALUES (@id, @name, @industry, @status, @scopeType, @criticality, @nextTest,
    @contact, @contract, @scope, @lat, @lng, @city)
  `),
  update: db.prepare(`
    UPDATE clients SET name=@name, industry=@industry, status=@status, scope_type=@scopeType,
    criticality=@criticality, next_test=@nextTest, contact=@contact, contract=@contract,
    scope=@scope, lat=@lat, lng=@lng, city=@city, updated_at=unixepoch()
    WHERE id=@id
  `),
  delete: db.prepare('DELETE FROM clients WHERE id = ?'),
}

// ─── FINDINGS ─────────────────────────────────────────────────────────────────

const findings = {
  all: () => db.prepare('SELECT * FROM findings ORDER BY created_at DESC').all().map(parseFinding),
  byId: (id) => parseFinding(db.prepare('SELECT * FROM findings WHERE id = ?').get(id)),
  byClient: (clientId) => db.prepare('SELECT * FROM findings WHERE client_id = ? ORDER BY created_at DESC').all(clientId).map(parseFinding),
  insert: db.prepare(`
    INSERT INTO findings (id, client_id, engagement_id, discovered_by, title, cve, cvss,
    severity, category, status, date, description, remediation)
    VALUES (@id, @clientId, @engagementId, @discoveredBy, @title, @cve, @cvss,
    @severity, @category, @status, @date, @description, @remediation)
  `),
  update: db.prepare(`
    UPDATE findings SET client_id=@clientId, engagement_id=@engagementId, title=@title,
    cve=@cve, cvss=@cvss, severity=@severity, category=@category, status=@status,
    date=@date, description=@description, remediation=@remediation, updated_at=unixepoch()
    WHERE id=@id
  `),
  delete: db.prepare('DELETE FROM findings WHERE id = ?'),
}

// ─── ENGAGEMENTS ──────────────────────────────────────────────────────────────

const engagements = {
  all: () => db.prepare('SELECT * FROM engagements ORDER BY created_at DESC').all().map(parseEngagement),
  byId: (id) => parseEngagement(db.prepare('SELECT * FROM engagements WHERE id = ?').get(id)),
  insert: db.prepare(`
    INSERT INTO engagements (id, client_id, title, type, start, end, status, phases, lead, assigned_to)
    VALUES (@id, @clientId, @title, @type, @start, @end, @status, @phases, @lead, @assignedTo)
  `),
  update: db.prepare(`
    UPDATE engagements SET client_id=@clientId, title=@title, type=@type, start=@start,
    end=@end, status=@status, phases=@phases, lead=@lead, assigned_to=@assignedTo,
    updated_at=unixepoch() WHERE id=@id
  `),
  delete: db.prepare('DELETE FROM engagements WHERE id = ?'),
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

const reports = {
  all: () => db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all().map(parseReport),
  byId: (id) => parseReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(id)),
  insert: db.prepare(`
    INSERT INTO reports (id, client_id, engagement_id, title, date, type, status)
    VALUES (@id, @clientId, @engagementId, @title, @date, @type, @status)
  `),
  update: db.prepare(`
    UPDATE reports SET client_id=@clientId, engagement_id=@engagementId, title=@title,
    date=@date, type=@type, status=@status WHERE id=@id
  `),
  delete: db.prepare('DELETE FROM reports WHERE id = ?'),
}

// ─── TIME ENTRIES ─────────────────────────────────────────────────────────────

const timeEntries = {
  all: () => db.prepare('SELECT * FROM time_entries ORDER BY date DESC, start DESC').all(),
  byUser: (userId) => db.prepare('SELECT * FROM time_entries WHERE user_id = ? ORDER BY date DESC').all(userId),
  insert: db.prepare(`
    INSERT INTO time_entries (id, user_id, user_name, date, start, end, duration)
    VALUES (@id, @userId, @userName, @date, @start, @end, @duration)
  `),
  delete: db.prepare('DELETE FROM time_entries WHERE id = ?'),
}

// ─── ENGAGEMENT GROUPS ────────────────────────────────────────────────────────

const engGroups = {
  all: () => db.prepare('SELECT * FROM eng_groups ORDER BY created_at').all().map(parseEngGroup),
  byId: (id) => parseEngGroup(db.prepare('SELECT * FROM eng_groups WHERE id = ?').get(id)),
  insert: db.prepare(`
    INSERT INTO eng_groups (id, name, description, member_ids, engagement_id, color)
    VALUES (@id, @name, @description, @memberIds, @engagementId, @color)
  `),
  update: db.prepare(`
    UPDATE eng_groups SET name=@name, description=@description,
    member_ids=@memberIds, engagement_id=@engagementId, color=@color WHERE id=@id
  `),
  delete: db.prepare('DELETE FROM eng_groups WHERE id = ?'),
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

const auditLogs = {
  all: (limit = 200) => db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit),
  insert: db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, role, action, details, category, ip, timestamp)
    VALUES (@id, @userId, @userName, @role, @action, @details, @category, @ip, @timestamp)
  `),
}

module.exports = { db, kv, users, clients, findings, engagements, reports, timeEntries, engGroups, auditLogs, j, p }
