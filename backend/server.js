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

const multer = require('multer')
const { init, kv, users, clients, findings, findingAttachments, engagements, reports, timeEntries, engGroups, auditLogs, j } = require('./db')

const app       = express()
const PORT      = process.env.PORT || 5173
const DIST_PATH   = path.join(__dirname, '..', 'dist')
const UPLOADS_DIR = path.join(__dirname, 'uploads')
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'])
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')
      cb(null, `${randomBytes(16).toString('hex')}${ext}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    ALLOWED_MIME.has(file.mimetype) ? cb(null, true) : cb(new Error('Ungültiger Dateityp'))
  },
})

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.set('trust proxy', 1) // nginx sitzt davor und setzt X-Forwarded-For
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: ALLOWED_ORIGIN, allowedHeaders: ['Content-Type'], credentials: true }))
app.use(express.json({ limit: '20mb' }))
app.use(cookieParser())

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

let JWT_SECRET

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
  return async (req, res, next) => {
    const user = await users.byId(req.user.memberId)
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

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort erforderlich.' })

  const user = await users.byEmail(email)
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

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await users.byId(req.user.memberId)
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

app.get('/api/users', requireAuth, async (req, res) => {
  const all = (await users.all()).map(({ password: _, ...u }) => u)
  res.json(all)
})

app.post('/api/users', requireAuth, requireRole('Admin'), async (req, res) => {
  const { name, email, password, role, title, skills, initials, color } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, E-Mail und Passwort erforderlich.' })
  if (await users.byEmail(email)) return res.status(409).json({ error: 'E-Mail bereits vergeben.' })

  const id   = `u${Date.now()}`
  const hash = bcrypt.hashSync(password, 12)
  await users.insert({ id, name, email, password: hash, role: role || 'Pentester',
    title: title || '', skills: j(skills || []), status: 'Active',
    initials: initials || name.slice(0, 2).toUpperCase(), color: color || 'cyan', nickname: '' })

  const { password: _, ...safe } = await users.byId(id)
  res.status(201).json(safe)
})

app.put('/api/users/:id', requireAuth, async (req, res) => {
  const me = await users.byId(req.user.memberId)
  if (me.id !== req.params.id && me.role !== 'Admin') {
    return res.status(403).json({ error: 'Keine Berechtigung.' })
  }
  const { name, email, role, title, skills, initials, color, nickname, status } = req.body || {}
  if (!name || !email) return res.status(400).json({ error: 'Name und E-Mail erforderlich.' })

  const other = await users.byEmail(email)
  if (other && other.id !== req.params.id) return res.status(409).json({ error: 'E-Mail bereits vergeben.' })

  await users.update({ id: req.params.id, name, email, role: role || 'Pentester',
    title: title || '', skills: j(skills || []),
    initials: initials || '', color: color || 'cyan', nickname: nickname || '', status: status || 'Active' })

  const { password: _, ...safe } = await users.byId(req.params.id)
  res.json(safe)
})

app.put('/api/users/:id/password', requireAuth, async (req, res) => {
  const me = await users.byId(req.user.memberId)
  if (me.id !== req.params.id && me.role !== 'Admin') {
    return res.status(403).json({ error: 'Keine Berechtigung.' })
  }
  const { password } = req.body || {}
  if (!password || password.length < 8) return res.status(400).json({ error: 'Passwort mind. 8 Zeichen.' })

  await users.updatePassword({ id: req.params.id, password: bcrypt.hashSync(password, 12) })
  res.json({ ok: true })
})

app.delete('/api/users/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  if (await users.count() <= 1) return res.status(400).json({ error: 'Letzter Nutzer kann nicht gelöscht werden.' })
  if (req.params.id === req.user.memberId) return res.status(400).json({ error: 'Eigenen Account nicht löschbar.' })
  await users.delete(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/clients', requireAuth, async (req, res) => res.json(await clients.all()))

app.post('/api/clients', requireAuth, async (req, res) => {
  const { name, industry, status, scopeType, criticality, nextTest, contact, contract, scope, lat, lng, city } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name erforderlich.' })
  const id = `c${Date.now()}`
  await clients.insert({ id, name, industry: industry || '', status: status || 'Active',
    scopeType: scopeType || 'Web', criticality: criticality || 'MEDIUM', nextTest: nextTest || '',
    contact: j(contact || {}), contract: j(contract || {}), scope: j(scope || {}),
    lat: lat || null, lng: lng || null, city: city || '' })
  res.status(201).json(await clients.byId(id))
})

app.put('/api/clients/:id', requireAuth, async (req, res) => {
  if (!await clients.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { name, industry, status, scopeType, criticality, nextTest, contact, contract, scope, lat, lng, city } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name erforderlich.' })
  await clients.update({ id: req.params.id, name, industry: industry || '', status: status || 'Active',
    scopeType: scopeType || 'Web', criticality: criticality || 'MEDIUM', nextTest: nextTest || '',
    contact: j(contact || {}), contract: j(contract || {}), scope: j(scope || {}),
    lat: lat || null, lng: lng || null, city: city || '' })
  res.json(await clients.byId(req.params.id))
})

app.delete('/api/clients/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), async (req, res) => {
  if (!await clients.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  await clients.delete(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FINDINGS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/findings', requireAuth, async (req, res) => {
  const result = req.query.clientId
    ? await findings.byClient(req.query.clientId)
    : await findings.all()
  res.json(result)
})

app.post('/api/findings', requireAuth, async (req, res) => {
  const { clientId, engagementId, title, cve, cvss, cvssVector, severity, category, status, date, description, remediation, note, dueDate } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  const id = `f${Date.now()}`
  await findings.insert({ id, clientId: clientId || null, engagementId: engagementId || null,
    discoveredBy: req.user.memberId, title, cve: cve || null, cvss: cvss || 0, cvssVector: cvssVector || '',
    severity: severity || 'MEDIUM', category: category || 'Other',
    status: status || 'Open', date: date || '', description: description || '', remediation: remediation || '',
    note: note || '', dueDate: dueDate || '' })
  res.status(201).json(await findings.byId(id))
})

app.put('/api/findings/:id', requireAuth, async (req, res) => {
  if (!await findings.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { clientId, engagementId, title, cve, cvss, cvssVector, severity, category, status, date, description, remediation, note, dueDate } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  await findings.update({ id: req.params.id, clientId: clientId || null, engagementId: engagementId || null,
    title, cve: cve || null, cvss: cvss || 0, cvssVector: cvssVector || '', severity: severity || 'MEDIUM',
    category: category || 'Other', status: status || 'Open',
    date: date || '', description: description || '', remediation: remediation || '',
    note: note || '', dueDate: dueDate || '' })
  res.json(await findings.byId(req.params.id))
})

app.delete('/api/findings/:id', requireAuth, async (req, res) => {
  if (!await findings.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  await findings.delete(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FINDING ATTACHMENTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/findings/:id/attachments', requireAuth, async (req, res) => {
  res.json(await findingAttachments.byFinding(req.params.id))
})

app.post('/api/findings/:id/attachments', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    next()
  })
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei.' })
  if (!await findings.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const id = `att${Date.now()}`
  await findingAttachments.insert({
    id, findingId: req.params.id, filename: req.file.filename,
    originalName: req.file.originalname, mimeType: req.file.mimetype,
    sizeBytes: req.file.size, uploadedBy: req.user.memberId,
  })
  res.status(201).json(await findingAttachments.byId(id))
})

app.get('/api/attachments/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename)
  const filePath = path.join(UPLOADS_DIR, filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Nicht gefunden.' })
  res.sendFile(filePath)
})

app.delete('/api/attachments/:id', requireAuth, async (req, res) => {
  const att = await findingAttachments.byId(req.params.id)
  if (!att) return res.status(404).json({ error: 'Nicht gefunden.' })
  const filePath = path.join(UPLOADS_DIR, att.filename)
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch {}
  await findingAttachments.delete(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ENGAGEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/engagements', requireAuth, async (req, res) => res.json(await engagements.all()))

app.post('/api/engagements', requireAuth, async (req, res) => {
  const { clientId, title, type, start, end, status, phases, lead, assignedTo, scope, methodology, contact, phaseChecks, phaseNotes } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  const id = `e${Date.now()}`
  await engagements.insert({ id, clientId: clientId || null, title, type: type || 'Web',
    start: start || '', end: end || '', status: status || 'Planned',
    phases: j(phases || []), lead: lead || '', assignedTo: j(assignedTo || []),
    scope: scope || '', methodology: methodology || 'Black Box', contact: contact || '',
    phaseChecks: phaseChecks || {}, phaseNotes: phaseNotes || {} })
  res.status(201).json(await engagements.byId(id))
})

app.put('/api/engagements/:id', requireAuth, async (req, res) => {
  if (!await engagements.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { clientId, title, type, start, end, status, phases, lead, assignedTo, scope, methodology, contact, phaseChecks, phaseNotes } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  await engagements.update({ id: req.params.id, clientId: clientId || null, title, type: type || 'Web',
    start: start || '', end: end || '', status: status || 'Planned',
    phases: j(phases || []), lead: lead || '', assignedTo: j(assignedTo || []),
    scope: scope || '', methodology: methodology || 'Black Box', contact: contact || '',
    phaseChecks: phaseChecks || {}, phaseNotes: phaseNotes || {} })
  res.json(await engagements.byId(req.params.id))
})

app.delete('/api/engagements/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), async (req, res) => {
  if (!await engagements.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  await engagements.delete(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/reports', requireAuth, async (req, res) => res.json(await reports.all()))

app.post('/api/reports', requireAuth, async (req, res) => {
  const { clientId, engagementId, title, date, type, status } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  const id = `r${Date.now()}`
  await reports.insert({ id, clientId: clientId || null, engagementId: engagementId || null,
    title, date: date || '', type: type || 'Technical Report', status: status || 'Draft' })
  res.status(201).json(await reports.byId(id))
})

app.put('/api/reports/:id', requireAuth, async (req, res) => {
  if (!await reports.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { clientId, engagementId, title, date, type, status } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Titel erforderlich.' })
  await reports.update({ id: req.params.id, clientId: clientId || null, engagementId: engagementId || null,
    title, date: date || '', type: type || 'Technical Report', status: status || 'Draft' })
  res.json(await reports.byId(req.params.id))
})

app.delete('/api/reports/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), async (req, res) => {
  if (!await reports.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  await reports.delete(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TIME ENTRIES
// ═══════════════════════════════════════════════════════════════════════════════

const mapTimeEntry = e => e ? { ...e, userId: e.user_id, userName: e.user_name } : null

app.get('/api/time-entries', requireAuth, async (req, res) => {
  const me = await users.byId(req.user.memberId)
  const result = me.role === 'Admin' || me.role === 'Senior Pentester'
    ? await timeEntries.all()
    : await timeEntries.byUser(req.user.memberId)
  res.json(result.map(mapTimeEntry))
})

app.post('/api/time-entries', requireAuth, async (req, res) => {
  const { userId, userName, date, start, end, duration, engagementId, clientId } = req.body || {}
  if (!date || !start || !end) return res.status(400).json({ error: 'Datum, Start und Ende erforderlich.' })
  const id = `te${Date.now()}`
  await timeEntries.insert({ id, userId: userId || req.user.memberId,
    userName: userName || '', date, start, end, duration: duration || 0,
    engagementId: engagementId || null, clientId: clientId || null })
  res.status(201).json(mapTimeEntry(await timeEntries.byIdRaw(id)))
})

app.delete('/api/time-entries/:id', requireAuth, async (req, res) => {
  await timeEntries.delete(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ENGAGEMENT GROUPS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/eng-groups', requireAuth, async (req, res) => res.json(await engGroups.all()))

app.post('/api/eng-groups', requireAuth, requireRole('Admin', 'Senior Pentester'), async (req, res) => {
  const { name, description, memberIds, engagementId, color } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name erforderlich.' })
  const id = `grp_${Date.now()}`
  await engGroups.insert({ id, name, description: description || '',
    memberIds: j(memberIds || []), engagementId: engagementId || null, color: color || 'cyan' })
  res.status(201).json(await engGroups.byId(id))
})

app.put('/api/eng-groups/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), async (req, res) => {
  if (!await engGroups.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  const { name, description, memberIds, engagementId, color } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name erforderlich.' })
  await engGroups.update({ id: req.params.id, name, description: description || '',
    memberIds: j(memberIds || []), engagementId: engagementId || null, color: color || 'cyan' })
  res.json(await engGroups.byId(req.params.id))
})

app.delete('/api/eng-groups/:id', requireAuth, requireRole('Admin', 'Senior Pentester'), async (req, res) => {
  if (!await engGroups.byId(req.params.id)) return res.status(404).json({ error: 'Nicht gefunden.' })
  await engGroups.delete(req.params.id)
  res.json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/audit-logs', requireAuth, requireRole('Admin'), async (req, res) => {
  res.json(await auditLogs.all(parseInt(req.query.limit) || 200))
})

app.post('/api/audit-logs', requireAuth, async (req, res) => {
  const { action, details, category } = req.body || {}
  const me = await users.byId(req.user.memberId)
  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
  await auditLogs.insert({
    id, userId: req.user.memberId, userName: me?.name || '',
    role: me?.role || '', action: action || '', details: details || '',
    category: category || '', ip: req.ip || '', timestamp: new Date().toISOString(),
  })
  res.status(201).json({ ok: true })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SEED
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/seed', requireAuth, requireRole('Admin'), async (req, res) => {
  const { CLIENTS: SC, FINDINGS: SF, ENGAGEMENTS: SE, REPORTS: SR } = require('./seedData')

  let seeded = 0
  for (const c of SC) {
    if (!await clients.byId(c.id)) {
      await clients.insert({ id: c.id, name: c.name, industry: c.industry||'', status: c.status||'Active',
        scopeType: c.scopeType||'Web', criticality: c.criticality||'MEDIUM', nextTest: c.nextTest||'',
        contact: j(c.contact||{}), contract: j(c.contract||{}), scope: j(c.scope||{}),
        lat: c.lat||null, lng: c.lng||null, city: c.city||'' })
      seeded++
    }
  }
  for (const e of SE) {
    if (!await engagements.byId(e.id)) {
      await engagements.insert({ id: e.id, clientId: e.clientId||null, title: e.title,
        type: e.type||'Web', start: e.start||'', end: e.end||'', status: e.status||'Planned',
        phases: j(e.phases||[]), lead: e.lead||'', assignedTo: j(e.assignedTo||[]) })
      seeded++
    }
  }
  for (const f of SF) {
    if (!await findings.byId(f.id)) {
      await findings.insert({ id: f.id, clientId: f.clientId||null, engagementId: f.engagementId||null,
        discoveredBy: f.discoveredBy||null, title: f.title, cve: f.cve||null, cvss: f.cvss||0,
        severity: f.severity||'MEDIUM', category: f.category||'Other', status: f.status||'Open',
        date: f.date||'', description: f.description||'', remediation: f.remediation||'' })
      seeded++
    }
  }
  for (const r of SR) {
    if (!await reports.byId(r.id)) {
      await reports.insert({ id: r.id, clientId: r.clientId||null, engagementId: r.engagementId||null,
        title: r.title, date: r.date||'', type: r.type||'Technical Report', status: r.status||'Draft' })
      seeded++
    }
  }
  res.json({ ok: true, seeded })
})

// ─── Legacy KV ────────────────────────────────────────────────────────────────

app.get('/api/state', requireAuth, async (req, res) => {
  const { getPool } = require('./db')
  const [rows] = await getPool().execute('SELECT `key`, value FROM kv')
  const state = {}
  for (const row of rows) {
    if (row.key === 'holysec_jwt_secret') continue
    try { state[row.key] = JSON.parse(row.value) } catch { state[row.key] = row.value }
  }
  res.json(state)
})

app.put('/api/kv/:key', requireAuth, async (req, res) => {
  if (req.params.key === 'holysec_jwt_secret') return res.status(403).json({ error: 'Forbidden' })
  await kv.set(req.params.key, JSON.stringify(req.body))
  res.json({ ok: true })
})

app.delete('/api/kv/:key', requireAuth, async (req, res) => {
  if (req.params.key === 'holysec_jwt_secret') return res.status(403).json({ error: 'Forbidden' })
  const { getPool } = require('./db')
  await getPool().execute('DELETE FROM kv WHERE `key` = ?', [req.params.key])
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

;(async () => {
  try {
    await init()

    // JWT Secret aus DB laden oder generieren
    const secretRow = await kv.get('holysec_jwt_secret')
    if (secretRow) {
      JWT_SECRET = JSON.parse(secretRow.value)
    } else {
      JWT_SECRET = randomBytes(32).toString('hex')
      await kv.set('holysec_jwt_secret', JSON.stringify(JWT_SECRET))
    }

    // Nutzer aus .env beim ersten Start anlegen
    try {
      const envUsers = JSON.parse(process.env.HOLYSEC_USERS || '[]')
      for (const u of envUsers) {
        const existing = await users.byEmail(u.email)
        if (!existing) {
          await users.insert({
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

    app.listen(PORT, '0.0.0.0', () => {
      try {
        const { execSync } = require('child_process')
        const ip = execSync("ip -4 addr show scope global | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}' | head -1").toString().trim()
        console.log(`\n  ─────────────────────────────────────────────────`)
        console.log(`  Lokal:    http://localhost:${PORT}/holySec/`)
        console.log(`  Netzwerk: http://${ip}:${PORT}/holySec/`)
        console.log(`  CORS:     ${ALLOWED_ORIGIN}`)
        console.log(`  DB:       MariaDB @ ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'holysec'}`)
        console.log(`  ─────────────────────────────────────────────────\n`)
      } catch {
        console.log(`\n  HolySec läuft auf: http://localhost:${PORT}/holySec/\n`)
      }
    })
  } catch (err) {
    console.error('[holySec] Startfehler:', err.message)
    process.exit(1)
  }
})()
