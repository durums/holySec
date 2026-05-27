require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const express      = require('express')
const bcrypt       = require('bcrypt')
const cookieParser = require('cookie-parser')
const cors         = require('cors')
const path         = require('path')
const fs           = require('fs')
const jwt          = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { rateLimit }   = require('express-rate-limit')
const helmet          = require('helmet')

const { db, kv, users, clients, findings, engagements, reports, timeEntries, engGroups, auditLogs, j } = require('./db')

const app       = express()
const PORT      = process.env.PORT || 5173
const DIST_PATH = path.join(__dirname, '..', 'dist')
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'

// ─── JWT SECRET ───────────────────────────────────────────────────────────────

let JWT_SECRET
const secretRow = kv.get.get('holysec_jwt_secret')
if (secretRow) {
  JWT_SECRET = JSON.parse(secretRow.value)
} else {
  JWT_SECRET = randomBytes(32).toString('hex')
  kv.set.run('holysec_jwt_secret', JSON.stringify(JWT_SECRET))
}

// ─── SEED: Nutzer aus .env beim ersten Start anlegen ─────────────────────────

try {
  const envUsers = JSON.parse(process.env.HOLYSEC_USERS || '[]')
  for (const u of envUsers) {
    const existing = users.byEmail(u.email)
    if (!existing) {
      users.insert.run({
        id:       u.memberId || `u_${Date.now()}`,
        name:     u.name  || u.email.split('@')[0],
        email:    u.email,
        password: u.password,
        role:     u.role  || 'Pentester',
        title:    u.title || '',
        skills:   j(u.skills || []),
        status:   'Active',
        initials: u.initials || u.email.slice(0, 2).toUpperCase(),
        color:    u.color || 'cyan',
        nickname: u.nickname || '',
      })
    }
  }
} catch (e) {
  console.error('[holySec] Seed-Fehler:', e.message)
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: ALLOWED_ORIGIN, allowedHeaders: ['Content-Type'], credentials: true }))
app.use(express.json({ limit: '20mb' }))
app.use(cookieParser())

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const token = req.cookies?.holysec_jwt
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (err) {
    res.clearCookie('holysec_jwt')
    const msg = err.name === 'TokenExpiredError' ? 'Token abgelaufen' : 'Ungültiges Token'
    return res.status(401).json({ error: msg })
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const user = users.byId(req.user.memberId)
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Keine Berechtigung.' })
    }
    next()
  }
}

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Zu viele Login-Versuche. Bitte in 15 Minuten erneut versuchen.' },
})

// ─── STATIC FRONTEND ──────────────────────────────────────────────────────────

if (fs.existsSync(DIST_PATH)) {
  app.use('/holySec', require('express').static(DIST_PATH))
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort erforderlich.' })

  const user = users.byEmail(email)
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Ungültige Zugangsdaten.' })
  }

  const token = jwt.sign({ memberId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' })
  res.cookie('holysec_jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000,
  })
  res.json({ memberId: user.id })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.byId(req.user.memberId)
  if (!user) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })
  const { password: _, ...safe } = user
  res.json(safe)
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('holysec_jwt')
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/users', requireAuth, (req, res) => {
  const all = users.all().map(({ password: _, ...u }) => u)
  res.json(all)
})

app.post('/api/users', requireAuth, requireRole('Admin'), (req, res) => {
  const { name, email, password, role, title, skills, initials, color } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, E-Mail und Passwort erforderlich.' })
  if (users.byEmail(email)) return res.status(409).json({ error: 'E-Mail bereits vergeben.' })

  const id   = `u${Date.now()}`
  const hash = bcrypt.hashSync(password, 12)
  users.insert.run({ id, name, email, password: hash, role: role || 'Pentester',
    title: title || '', skills: j(skills || []), status: 'Active',
    initials: initials || name.slice(0, 2).toUpperCase(), color: color || 'cyan', nickname: '' })

  const { password: _, ...safe } = users.byId(id)
  res.status(201).json(safe)
})

app.put('/api/users/:id', requireAuth, (req, res) => {
  const me = users.byId(req.user.memberId)
  if (me.id !== req.params.id && me.role !== 'Admin') {
    return res.status(403).json({ error: 'Keine Berechtigung.' })
  }
  const { name, email, role, title, skills, initials, color, nickname, status } = req.body || {}
  if (!name || !email) return res.status(400).json({ error: 'Name und E-Mail erforderlich.' })

  const other = users.byEmail(email)
  if (other && other.id !== req.params.id) return res.status(409).json({ error: 'E-Mail bereits vergeben.' })

  users.update.run({ id: req.params.id, name, email, role: role || 'Pentester',
    title: title || '', skills: j(skills || []),
    initials: initials || '', color: color || 'cyan', nickname: nickname || '', status: status || 'Active' })

  const { password: _, ...safe } = users.byId(req.params.id)
  res.json(safe)
})

app.put('/api/users/:id/password', requireAuth, (req, res) => {
  const me = users.byId(req.user.memberId)
  if (me.id !== req.params.id && me.role !== 'Admin') {
    return res.status(403).json({ error: 'Keine Berechtigung.' })
  }
  const { password } = req.body || {}
  if (!password || password.length < 8) return res.status(400).json({ error: 'Passwort mind. 8 Zeichen.' })

  users.updatePassword.run({ id: req.params.id, password: bcrypt.hashSync(password, 12) })
  res.json({ ok: true })
})

app.delete('/api/users/:id', requireAuth, requireRole('Admin'), (req, res) => {
  if (users.count() <= 1) return res.status(400).json({ error: 'Letzter Nutzer kann nicht gelöscht werden.' })
  if (req.params.id === req.user.memberId) return res.status(400).json({ error: 'Eigenen Account nicht löschbar.' })
  users.delete.run(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/clients', requireAuth, (req, res) => res.json(clients.all()))

app.post('/api/clients', requireAuth, (req, res) => {
  const { name, industry, status, scopeType, criticality, nextTest, contact, contract, scope, lat, lng, city } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name erforderlich.' })
  const id = `c${Date.now()}`
  clients.insert.run({ id, name, industry: industry || '', status: status || 'Active',
    scopeType: scopeType || 'Web', criticality: criticality || 'MEDIUM', nextTest: nextTest || '',
    contact: j(contact || {}), contract: j(contract || {}), scope: j(scope || {}),
    lat: lat || null, lng: lng || null, city: city || '' })
  res.status(201).json(clients.byId(id))
})

app.put('/api/clients/:id', requireAuth, (req, res) => {
  if (!clients.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { name, industry, status, scopeType, criticality, nextTest, contact, contract, scope, lat, lng, city } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name erforderlich.' })
  clients.update.run({ id: req.params.id, name, industry: industry || '', status: status || 'Active',
    scopeType: scopeType || 'Web', criticality: criticality || 'MEDIUM', nextTest: nextTest || '',
    contact: j(contact || {}), contract: j(contract || {}), scope: j(scope || {}),
    lat: lat || null, lng: lng || null, city: city || '' })
  res.json(clients.byId(req.params.id))
})

app.delete('/api/clients/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), (req, res) => {
  if (!clients.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  clients.delete.run(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FINDINGS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/findings', requireAuth, (req, res) => {
  const result = req.query.clientId
    ? findings.byClient(req.query.clientId)
    : findings.all()
  res.json(result)
})

app.post('/api/findings', requireAuth, (req, res) => {
  const { clientId, engagementId, title, cve, cvss, severity, category, status, date, description, remediation } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  const id = `f${Date.now()}`
  findings.insert.run({ id, clientId: clientId || null, engagementId: engagementId || null,
    discoveredBy: req.user.memberId, title, cve: cve || null, cvss: cvss || 0,
    severity: severity || 'MEDIUM', category: category || 'Other',
    status: status || 'Open', date: date || '', description: description || '', remediation: remediation || '' })
  res.status(201).json(findings.byId(id))
})

app.put('/api/findings/:id', requireAuth, (req, res) => {
  if (!findings.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { clientId, engagementId, title, cve, cvss, severity, category, status, date, description, remediation } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  findings.update.run({ id: req.params.id, clientId: clientId || null, engagementId: engagementId || null,
    title, cve: cve || null, cvss: cvss || 0, severity: severity || 'MEDIUM',
    category: category || 'Other', status: status || 'Open',
    date: date || '', description: description || '', remediation: remediation || '' })
  res.json(findings.byId(req.params.id))
})

app.delete('/api/findings/:id', requireAuth, (req, res) => {
  if (!findings.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  findings.delete.run(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ENGAGEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/engagements', requireAuth, (req, res) => res.json(engagements.all()))

app.post('/api/engagements', requireAuth, (req, res) => {
  const { clientId, title, type, start, end, status, phases, lead, assignedTo } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  const id = `e${Date.now()}`
  engagements.insert.run({ id, clientId: clientId || null, title, type: type || 'Web',
    start: start || '', end: end || '', status: status || 'Planned',
    phases: j(phases || []), lead: lead || '', assignedTo: j(assignedTo || []) })
  res.status(201).json(engagements.byId(id))
})

app.put('/api/engagements/:id', requireAuth, (req, res) => {
  if (!engagements.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { clientId, title, type, start, end, status, phases, lead, assignedTo } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  engagements.update.run({ id: req.params.id, clientId: clientId || null, title, type: type || 'Web',
    start: start || '', end: end || '', status: status || 'Planned',
    phases: j(phases || []), lead: lead || '', assignedTo: j(assignedTo || []) })
  res.json(engagements.byId(req.params.id))
})

app.delete('/api/engagements/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), (req, res) => {
  if (!engagements.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  engagements.delete.run(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/reports', requireAuth, (req, res) => res.json(reports.all()))

app.post('/api/reports', requireAuth, (req, res) => {
  const { clientId, engagementId, title, date, type, status } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  const id = `r${Date.now()}`
  reports.insert.run({ id, clientId: clientId || null, engagementId: engagementId || null,
    title, date: date || '', type: type || 'Technical Report', status: status || 'Draft' })
  res.status(201).json(reports.byId(id))
})

app.put('/api/reports/:id', requireAuth, (req, res) => {
  if (!reports.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { clientId, engagementId, title, date, type, status } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  reports.update.run({ id: req.params.id, clientId: clientId || null, engagementId: engagementId || null,
    title, date: date || '', type: type || 'Technical Report', status: status || 'Draft' })
  res.json(reports.byId(req.params.id))
})

app.delete('/api/reports/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), (req, res) => {
  if (!reports.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  reports.delete.run(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TIME ENTRIES
// ═══════════════════════════════════════════════════════════════════════════════

const mapTimeEntry = e => e ? { ...e, userId: e.user_id, userName: e.user_name } : null

app.get('/api/time-entries', requireAuth, (req, res) => {
  const me = users.byId(req.user.memberId)
  const result = me.role === 'Admin' || me.role === 'Senior Pentester'
    ? timeEntries.all()
    : timeEntries.byUser(req.user.memberId)
  res.json(result.map(mapTimeEntry))
})

app.post('/api/time-entries', requireAuth, (req, res) => {
  const { userId, userName, date, start, end, duration } = req.body || {}
  if (!date || !start || !end) return res.status(400).json({ error: 'Datum, Start und Ende erforderlich.' })
  const id = `te${Date.now()}`
  timeEntries.insert.run({ id, userId: userId || req.user.memberId,
    userName: userName || '', date, start, end, duration: duration || 0 })
  res.status(201).json(mapTimeEntry(timeEntries.all().find(e => e.id === id)))
})

app.delete('/api/time-entries/:id', requireAuth, (req, res) => {
  timeEntries.delete.run(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ENGAGEMENT GROUPS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/eng-groups', requireAuth, (req, res) => res.json(engGroups.all()))

app.post('/api/eng-groups', requireAuth, requireRole('Admin', 'Senior Pentester'), (req, res) => {
  const { name, description, memberIds, engagementId, color } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name erforderlich.' })
  const id = `grp_${Date.now()}`
  engGroups.insert.run({ id, name, description: description || '',
    memberIds: j(memberIds || []), engagementId: engagementId || null, color: color || 'cyan' })
  res.status(201).json(engGroups.byId(id))
})

app.put('/api/eng-groups/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), (req, res) => {
  if (!engGroups.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { name, description, memberIds, engagementId, color } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name erforderlich.' })
  engGroups.update.run({ id: req.params.id, name, description: description || '',
    memberIds: j(memberIds || []), engagementId: engagementId || null, color: color || 'cyan' })
  res.json(engGroups.byId(req.params.id))
})

app.delete('/api/eng-groups/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), (req, res) => {
  if (!engGroups.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  engGroups.delete.run(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/audit-logs', requireAuth, requireRole('Admin'), (req, res) => {
  res.json(auditLogs.all(parseInt(req.query.limit) || 200))
})

app.post('/api/audit-logs', requireAuth, (req, res) => {
  const { action, details, category } = req.body || {}
  const me = users.byId(req.user.memberId)
  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
  auditLogs.insert.run({
    id, userId: req.user.memberId, userName: me?.name || '',
    role: me?.role || '', action: action || '', details: details || '',
    category: category || '', ip: req.ip || '', timestamp: new Date().toISOString(),
  })
  res.status(201).json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SEED (einmalig beim ersten Start)
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/seed', requireAuth, requireRole('Admin'), (req, res) => {
  const { CLIENTS: SC, FINDINGS: SF, ENGAGEMENTS: SE, REPORTS: SR } = require('./seedData')

  let seeded = 0
  const run = db.transaction(() => {
    for (const c of SC) {
      if (!clients.byId(c.id)) {
        clients.insert.run({ id:c.id, name:c.name, industry:c.industry||'', status:c.status||'Active',
          scopeType:c.scopeType||'Web', criticality:c.criticality||'MEDIUM', nextTest:c.nextTest||'',
          contact:j(c.contact||{}), contract:j(c.contract||{}), scope:j(c.scope||{}),
          lat:c.lat||null, lng:c.lng||null, city:c.city||'' })
        seeded++
      }
    }
    for (const e of SE) {
      if (!engagements.byId(e.id)) {
        engagements.insert.run({ id:e.id, clientId:e.clientId||null, title:e.title,
          type:e.type||'Web', start:e.start||'', end:e.end||'', status:e.status||'Planned',
          phases:j(e.phases||[]), lead:e.lead||'', assignedTo:j(e.assignedTo||[]) })
        seeded++
      }
    }
    for (const f of SF) {
      if (!findings.byId(f.id)) {
        findings.insert.run({ id:f.id, clientId:f.clientId||null, engagementId:f.engagementId||null,
          discoveredBy:f.discoveredBy||null, title:f.title, cve:f.cve||null, cvss:f.cvss||0,
          severity:f.severity||'MEDIUM', category:f.category||'Other', status:f.status||'Open',
          date:f.date||'', description:f.description||'', remediation:f.remediation||'' })
        seeded++
      }
    }
    for (const r of SR) {
      if (!reports.byId(r.id)) {
        reports.insert.run({ id:r.id, clientId:r.clientId||null, engagementId:r.engagementId||null,
          title:r.title, date:r.date||'', type:r.type||'Technical Report', status:r.status||'Draft' })
        seeded++
      }
    }
  })
  run()
  res.json({ ok: true, seeded })
})

// ─── Legacy KV (für App-internen State der noch nicht migriert ist) ────────────

app.get('/api/state', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM kv').all()
  const state = {}
  for (const row of rows) {
    if (row.key === 'holysec_jwt_secret') continue
    try { state[row.key] = JSON.parse(row.value) } catch { state[row.key] = row.value }
  }
  res.json(state)
})

app.put('/api/kv/:key', requireAuth, (req, res) => {
  if (req.params.key === 'holysec_jwt_secret') return res.status(403).json({ error: 'Forbidden' })
  kv.set.run(req.params.key, JSON.stringify(req.body))
  res.json({ ok: true })
})

app.delete('/api/kv/:key', requireAuth, (req, res) => {
  if (req.params.key === 'holysec_jwt_secret') return res.status(403).json({ error: 'Forbidden' })
  db.prepare('DELETE FROM kv WHERE key = ?').run(req.params.key)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SPA FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

const INDEX_PATH = path.join(DIST_PATH, 'index.html')

app.get('/', (req, res) => res.redirect('/holySec/'))
app.get('/holySec/*', (req, res) => {
  if (fs.existsSync(INDEX_PATH)) res.sendFile(INDEX_PATH)
  else res.status(503).send('Frontend not built. Run: npm run build')
})

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  try {
    const { execSync } = require('child_process')
    const ip = execSync("ip -4 addr show scope global | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}' | head -1").toString().trim()
    console.log(`\n  ─────────────────────────────────────────────────`)
    console.log(`  Lokal:    http://localhost:${PORT}/holySec/`)
    console.log(`  Netzwerk: http://${ip}:${PORT}/holySec/`)
    console.log(`  CORS:     ${ALLOWED_ORIGIN}`)
    console.log(`  ─────────────────────────────────────────────────\n`)
  } catch {
    console.log(`\n  HolySec läuft auf: http://localhost:${PORT}/holySec/\n`)
  }
})
