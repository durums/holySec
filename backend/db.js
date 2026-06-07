const mysql = require('mysql2/promise')

let pool

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
  const cvssVector = row.cvss_vector ? p(row.cvss_vector) : null
  return { ...row, clientId: row.client_id, engagementId: row.engagement_id, discoveredBy: row.discovered_by, cvssVector, note: row.note || '', dueDate: row.due_date || '' }
}

function parseEngagement(row) {
  if (!row) return null
  return { ...row, clientId: row.client_id, phases: p(row.phases), assignedTo: p(row.assigned_to), scope: row.scope || '', methodology: row.methodology || 'Black Box', contact: row.contact || '', phaseChecks: p(row.phase_checks || '{}'), phaseNotes: p(row.phase_notes || '{}') }
}

function parseReport(row) {
  if (!row) return null
  return { ...row, clientId: row.client_id, engagementId: row.engagement_id }
}

function parseEngGroup(row) {
  if (!row) return null
  return { ...row, memberIds: p(row.member_ids), engagementId: row.engagement_id }
}

async function init() {
  pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'holysec',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'holysec',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  })

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      \`key\`     VARCHAR(100) PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at BIGINT DEFAULT (UNIX_TIMESTAMP())
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         VARCHAR(50) PRIMARY KEY,
      name       TEXT NOT NULL,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       VARCHAR(50) NOT NULL DEFAULT 'Pentester',
      title      TEXT DEFAULT '',
      skills     TEXT DEFAULT '[]',
      status     VARCHAR(50) DEFAULT 'Active',
      initials   VARCHAR(10) DEFAULT '',
      color      VARCHAR(30) DEFAULT 'cyan',
      nickname   TEXT DEFAULT '',
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP())
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id          VARCHAR(50) PRIMARY KEY,
      name        TEXT NOT NULL,
      industry    TEXT DEFAULT '',
      status      VARCHAR(50) DEFAULT 'Active',
      scope_type  VARCHAR(50) DEFAULT 'Web',
      criticality VARCHAR(20) DEFAULT 'MEDIUM',
      next_test   VARCHAR(20) DEFAULT '',
      contact     TEXT DEFAULT '{}',
      contract    TEXT DEFAULT '{}',
      scope       TEXT DEFAULT '{}',
      lat         DOUBLE,
      lng         DOUBLE,
      city        TEXT DEFAULT '',
      created_at  BIGINT DEFAULT (UNIX_TIMESTAMP()),
      updated_at  BIGINT DEFAULT (UNIX_TIMESTAMP())
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS engagements (
      id          VARCHAR(50) PRIMARY KEY,
      client_id   VARCHAR(50),
      title       TEXT NOT NULL,
      type        VARCHAR(50) DEFAULT 'Web',
      start       VARCHAR(20) DEFAULT '',
      end         VARCHAR(20) DEFAULT '',
      status      VARCHAR(50) DEFAULT 'Planned',
      phases      TEXT DEFAULT '[]',
      lead        TEXT DEFAULT '',
      assigned_to TEXT DEFAULT '[]',
      created_at  BIGINT DEFAULT (UNIX_TIMESTAMP()),
      updated_at  BIGINT DEFAULT (UNIX_TIMESTAMP()),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS findings (
      id            VARCHAR(50) PRIMARY KEY,
      client_id     VARCHAR(50),
      engagement_id VARCHAR(50),
      discovered_by VARCHAR(50),
      title         TEXT NOT NULL,
      cve           VARCHAR(30),
      cvss          DOUBLE DEFAULT 0,
      severity      VARCHAR(20) DEFAULT 'MEDIUM',
      category      VARCHAR(50) DEFAULT 'Other',
      status        VARCHAR(30) DEFAULT 'Open',
      date          VARCHAR(20) DEFAULT '',
      description   TEXT DEFAULT '',
      remediation   TEXT DEFAULT '',
      created_at    BIGINT DEFAULT (UNIX_TIMESTAMP()),
      updated_at    BIGINT DEFAULT (UNIX_TIMESTAMP()),
      FOREIGN KEY (client_id)     REFERENCES clients(id)     ON DELETE SET NULL,
      FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE SET NULL,
      FOREIGN KEY (discovered_by) REFERENCES users(id)       ON DELETE SET NULL
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id            VARCHAR(50) PRIMARY KEY,
      client_id     VARCHAR(50),
      engagement_id VARCHAR(50),
      title         TEXT NOT NULL,
      date          VARCHAR(20) DEFAULT '',
      type          VARCHAR(50) DEFAULT 'Technical Report',
      status        VARCHAR(30) DEFAULT 'Draft',
      created_at    BIGINT DEFAULT (UNIX_TIMESTAMP()),
      FOREIGN KEY (client_id)     REFERENCES clients(id)     ON DELETE SET NULL,
      FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE SET NULL
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id         VARCHAR(50) PRIMARY KEY,
      user_id    VARCHAR(50),
      user_name  TEXT DEFAULT '',
      date       VARCHAR(20) DEFAULT '',
      start      VARCHAR(10) DEFAULT '',
      end        VARCHAR(10) DEFAULT '',
      duration   INT DEFAULT 0,
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP()),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS eng_groups (
      id            VARCHAR(50) PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT DEFAULT '',
      member_ids    TEXT DEFAULT '[]',
      engagement_id VARCHAR(50),
      color         VARCHAR(30) DEFAULT 'cyan',
      created_at    BIGINT DEFAULT (UNIX_TIMESTAMP())
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         VARCHAR(80) PRIMARY KEY,
      user_id    VARCHAR(50) DEFAULT '',
      user_name  TEXT DEFAULT '',
      role       VARCHAR(50) DEFAULT '',
      action     TEXT DEFAULT '',
      details    TEXT DEFAULT '',
      category   VARCHAR(50) DEFAULT '',
      ip         VARCHAR(50) DEFAULT '',
      timestamp  VARCHAR(40) DEFAULT '',
      created_at BIGINT DEFAULT (UNIX_TIMESTAMP())
    )
  `)

  await pool.execute(`ALTER TABLE engagements ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT ''`)
  await pool.execute(`ALTER TABLE engagements ADD COLUMN IF NOT EXISTS methodology VARCHAR(50) DEFAULT 'Black Box'`)
  await pool.execute(`ALTER TABLE engagements ADD COLUMN IF NOT EXISTS contact TEXT DEFAULT ''`)
  await pool.execute(`ALTER TABLE engagements ADD COLUMN IF NOT EXISTS phase_checks TEXT DEFAULT '{}'`)
  await pool.execute(`ALTER TABLE engagements ADD COLUMN IF NOT EXISTS phase_notes TEXT DEFAULT '{}'`)
  await pool.execute(`ALTER TABLE findings ADD COLUMN IF NOT EXISTS cvss_vector TEXT DEFAULT ''`)
  await pool.execute(`ALTER TABLE findings ADD COLUMN IF NOT EXISTS note TEXT DEFAULT ''`)
  await pool.execute(`ALTER TABLE findings ADD COLUMN IF NOT EXISTS due_date VARCHAR(20) DEFAULT ''`)
  await pool.execute(`ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS engagement_id VARCHAR(50) DEFAULT NULL`)
  await pool.execute(`ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS client_id VARCHAR(50) DEFAULT NULL`)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS finding_attachments (
      id            VARCHAR(50) PRIMARY KEY,
      finding_id    VARCHAR(50),
      filename      VARCHAR(255) NOT NULL,
      original_name TEXT DEFAULT '',
      mime_type     VARCHAR(100) DEFAULT '',
      size_bytes    INT DEFAULT 0,
      uploaded_by   VARCHAR(50),
      created_at    BIGINT DEFAULT (UNIX_TIMESTAMP()),
      FOREIGN KEY (finding_id)  REFERENCES findings(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)    ON DELETE SET NULL
    )
  `)
}

const kv = {
  async get(key) {
    const [rows] = await pool.execute('SELECT value FROM kv WHERE `key` = ?', [key])
    return rows[0] || null
  },
  async set(key, value) {
    await pool.execute(
      'INSERT INTO kv (`key`, value, updated_at) VALUES (?, ?, UNIX_TIMESTAMP()) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = UNIX_TIMESTAMP()',
      [key, value]
    )
  },
}

const users = {
  async all() {
    const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at')
    return rows.map(parseUser)
  },
  async byId(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id])
    return parseUser(rows[0] || null)
  },
  async byEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email])
    return parseUser(rows[0] || null)
  },
  async insert({ id, name, email, password, role, title, skills, status, initials, color, nickname }) {
    await pool.execute(
      'INSERT INTO users (id, name, email, password, role, title, skills, status, initials, color, nickname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, password, role, title||'', skills||'[]', status||'Active', initials||'', color||'cyan', nickname||'']
    )
  },
  async update({ id, name, email, role, title, skills, status, initials, color, nickname }) {
    await pool.execute(
      'UPDATE users SET name=?, email=?, role=?, title=?, skills=?, status=?, initials=?, color=?, nickname=? WHERE id=?',
      [name, email, role, title||'', skills||'[]', status||'Active', initials||'', color||'cyan', nickname||'', id]
    )
  },
  async updatePassword({ id, password }) {
    await pool.execute('UPDATE users SET password=? WHERE id=?', [password, id])
  },
  async delete(id) {
    await pool.execute('DELETE FROM users WHERE id = ?', [id])
  },
  async count() {
    const [rows] = await pool.execute('SELECT COUNT(*) AS n FROM users')
    return rows[0].n
  },
}

const clients = {
  async all() {
    const [rows] = await pool.execute('SELECT * FROM clients ORDER BY created_at')
    return rows.map(parseClient)
  },
  async byId(id) {
    const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id])
    return parseClient(rows[0] || null)
  },
  async insert({ id, name, industry, status, scopeType, criticality, nextTest, contact, contract, scope, lat, lng, city }) {
    await pool.execute(
      'INSERT INTO clients (id, name, industry, status, scope_type, criticality, next_test, contact, contract, scope, lat, lng, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, industry||'', status||'Active', scopeType||'Web', criticality||'MEDIUM', nextTest||'', contact||'{}', contract||'{}', scope||'{}', lat||null, lng||null, city||'']
    )
  },
  async update({ id, name, industry, status, scopeType, criticality, nextTest, contact, contract, scope, lat, lng, city }) {
    await pool.execute(
      'UPDATE clients SET name=?, industry=?, status=?, scope_type=?, criticality=?, next_test=?, contact=?, contract=?, scope=?, lat=?, lng=?, city=?, updated_at=UNIX_TIMESTAMP() WHERE id=?',
      [name, industry||'', status||'Active', scopeType||'Web', criticality||'MEDIUM', nextTest||'', contact||'{}', contract||'{}', scope||'{}', lat||null, lng||null, city||'', id]
    )
  },
  async delete(id) {
    await pool.execute('DELETE FROM clients WHERE id = ?', [id])
  },
}

const findings = {
  async all() {
    const [rows] = await pool.execute('SELECT * FROM findings ORDER BY created_at DESC')
    return rows.map(parseFinding)
  },
  async byId(id) {
    const [rows] = await pool.execute('SELECT * FROM findings WHERE id = ?', [id])
    return parseFinding(rows[0] || null)
  },
  async byClient(clientId) {
    const [rows] = await pool.execute('SELECT * FROM findings WHERE client_id = ? ORDER BY created_at DESC', [clientId])
    return rows.map(parseFinding)
  },
  async insert({ id, clientId, engagementId, discoveredBy, title, cve, cvss, cvssVector, severity, category, status, date, description, remediation, note, dueDate }) {
    await pool.execute(
      'INSERT INTO findings (id, client_id, engagement_id, discovered_by, title, cve, cvss, cvss_vector, severity, category, status, date, description, remediation, note, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, clientId||null, engagementId||null, discoveredBy||null, title, cve||null, cvss||0, cvssVector||'', severity||'MEDIUM', category||'Other', status||'Open', date||'', description||'', remediation||'', note||'', dueDate||'']
    )
  },
  async update({ id, clientId, engagementId, title, cve, cvss, cvssVector, severity, category, status, date, description, remediation, note, dueDate }) {
    await pool.execute(
      'UPDATE findings SET client_id=?, engagement_id=?, title=?, cve=?, cvss=?, cvss_vector=?, severity=?, category=?, status=?, date=?, description=?, remediation=?, note=?, due_date=?, updated_at=UNIX_TIMESTAMP() WHERE id=?',
      [clientId||null, engagementId||null, title, cve||null, cvss||0, cvssVector||'', severity||'MEDIUM', category||'Other', status||'Open', date||'', description||'', remediation||'', note||'', dueDate||'', id]
    )
  },
  async delete(id) {
    await pool.execute('DELETE FROM findings WHERE id = ?', [id])
  },
}

const engagements = {
  async all() {
    const [rows] = await pool.execute('SELECT * FROM engagements ORDER BY created_at DESC')
    return rows.map(parseEngagement)
  },
  async byId(id) {
    const [rows] = await pool.execute('SELECT * FROM engagements WHERE id = ?', [id])
    return parseEngagement(rows[0] || null)
  },
  async insert({ id, clientId, title, type, start, end, status, phases, lead, assignedTo, scope, methodology, contact, phaseChecks, phaseNotes }) {
    const j = v => JSON.stringify(v ?? null)
    await pool.execute(
      'INSERT INTO engagements (id, client_id, title, type, start, end, status, phases, lead, assigned_to, scope, methodology, contact, phase_checks, phase_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, clientId||null, title, type||'Web', start||'', end||'', status||'Planned', phases||'[]', lead||'', assignedTo||'[]', scope||'', methodology||'Black Box', contact||'', j(phaseChecks||{}), j(phaseNotes||{})]
    )
  },
  async update({ id, clientId, title, type, start, end, status, phases, lead, assignedTo, scope, methodology, contact, phaseChecks, phaseNotes }) {
    const j = v => JSON.stringify(v ?? null)
    await pool.execute(
      'UPDATE engagements SET client_id=?, title=?, type=?, start=?, end=?, status=?, phases=?, lead=?, assigned_to=?, scope=?, methodology=?, contact=?, phase_checks=?, phase_notes=?, updated_at=UNIX_TIMESTAMP() WHERE id=?',
      [clientId||null, title, type||'Web', start||'', end||'', status||'Planned', phases||'[]', lead||'', assignedTo||'[]', scope||'', methodology||'Black Box', contact||'', j(phaseChecks||{}), j(phaseNotes||{}), id]
    )
  },
  async delete(id) {
    await pool.execute('DELETE FROM engagements WHERE id = ?', [id])
  },
}

const reports = {
  async all() {
    const [rows] = await pool.execute('SELECT * FROM reports ORDER BY created_at DESC')
    return rows.map(parseReport)
  },
  async byId(id) {
    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id])
    return parseReport(rows[0] || null)
  },
  async insert({ id, clientId, engagementId, title, date, type, status }) {
    await pool.execute(
      'INSERT INTO reports (id, client_id, engagement_id, title, date, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, clientId||null, engagementId||null, title, date||'', type||'Technical Report', status||'Draft']
    )
  },
  async update({ id, clientId, engagementId, title, date, type, status }) {
    await pool.execute(
      'UPDATE reports SET client_id=?, engagement_id=?, title=?, date=?, type=?, status=? WHERE id=?',
      [clientId||null, engagementId||null, title, date||'', type||'Technical Report', status||'Draft', id]
    )
  },
  async delete(id) {
    await pool.execute('DELETE FROM reports WHERE id = ?', [id])
  },
}

const timeEntries = {
  async all() {
    const [rows] = await pool.execute('SELECT * FROM time_entries ORDER BY date DESC, start DESC')
    return rows
  },
  async byUser(userId) {
    const [rows] = await pool.execute('SELECT * FROM time_entries WHERE user_id = ? ORDER BY date DESC', [userId])
    return rows
  },
  async insert({ id, userId, userName, date, start, end, duration, engagementId, clientId }) {
    await pool.execute(
      'INSERT INTO time_entries (id, user_id, user_name, date, start, end, duration, engagement_id, client_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId||null, userName||'', date, start, end, duration||0, engagementId||null, clientId||null]
    )
  },
  async byIdRaw(id) {
    const [rows] = await pool.execute('SELECT * FROM time_entries WHERE id = ?', [id])
    return rows[0] || null
  },
  async delete(id) {
    await pool.execute('DELETE FROM time_entries WHERE id = ?', [id])
  },
}

const engGroups = {
  async all() {
    const [rows] = await pool.execute('SELECT * FROM eng_groups ORDER BY created_at')
    return rows.map(parseEngGroup)
  },
  async byId(id) {
    const [rows] = await pool.execute('SELECT * FROM eng_groups WHERE id = ?', [id])
    return parseEngGroup(rows[0] || null)
  },
  async insert({ id, name, description, memberIds, engagementId, color }) {
    await pool.execute(
      'INSERT INTO eng_groups (id, name, description, member_ids, engagement_id, color) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, description||'', memberIds||'[]', engagementId||null, color||'cyan']
    )
  },
  async update({ id, name, description, memberIds, engagementId, color }) {
    await pool.execute(
      'UPDATE eng_groups SET name=?, description=?, member_ids=?, engagement_id=?, color=? WHERE id=?',
      [name, description||'', memberIds||'[]', engagementId||null, color||'cyan', id]
    )
  },
  async delete(id) {
    await pool.execute('DELETE FROM eng_groups WHERE id = ?', [id])
  },
}

const auditLogs = {
  async all(limit = 200) {
    const [rows] = await pool.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?', [limit])
    return rows
  },
  async insert({ id, userId, userName, role, action, details, category, ip, timestamp }) {
    await pool.execute(
      'INSERT INTO audit_logs (id, user_id, user_name, role, action, details, category, ip, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId||'', userName||'', role||'', action||'', details||'', category||'', ip||'', timestamp||'']
    )
  },
}

const findingAttachments = {
  async byFinding(findingId) {
    const [rows] = await pool.execute('SELECT * FROM finding_attachments WHERE finding_id = ? ORDER BY created_at', [findingId])
    return rows
  },
  async byId(id) {
    const [rows] = await pool.execute('SELECT * FROM finding_attachments WHERE id = ?', [id])
    return rows[0] || null
  },
  async insert({ id, findingId, filename, originalName, mimeType, sizeBytes, uploadedBy }) {
    await pool.execute(
      'INSERT INTO finding_attachments (id, finding_id, filename, original_name, mime_type, size_bytes, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, findingId||null, filename, originalName||'', mimeType||'', sizeBytes||0, uploadedBy||null]
    )
  },
  async delete(id) {
    await pool.execute('DELETE FROM finding_attachments WHERE id = ?', [id])
  },
}

module.exports = { init, kv, users, clients, findings, findingAttachments, engagements, reports, timeEntries, engGroups, auditLogs, j, p, getPool: () => pool }
