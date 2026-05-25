require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const express    = require('express')
const Database   = require('better-sqlite3')
const cors       = require('cors')
const path       = require('path')
const fs         = require('fs')
const jwt        = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { rateLimit } = require('express-rate-limit')

const app       = express()
const PORT      = process.env.PORT || 5173
const DB_PATH   = path.join(__dirname, 'holysec.db')
const DIST_PATH = path.join(__dirname, '..', 'dist')

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'

// ─── DATABASE ─────────────────────────────────────────────────────────────────

const db = new Database(DB_PATH)
db.exec(`
  CREATE TABLE IF NOT EXISTS kv (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
  )
`)

const stmtGet    = db.prepare('SELECT value FROM kv WHERE key = ?')
const stmtUpsert = db.prepare(`
  INSERT INTO kv (key, value, updated_at) VALUES (?, ?, unixepoch())
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()
`)
const stmtDelete = db.prepare('DELETE FROM kv WHERE key = ?')
const stmtAll    = db.prepare('SELECT key, value FROM kv')

function parseRow(row) {
  if (!row) return null
  try { return JSON.parse(row.value) } catch { return row.value }
}

// ─── JWT SECRET (persistiert in DB) ──────────────────────────────────────────

let JWT_SECRET
const secretRow = stmtGet.get('holysec_jwt_secret')
if (secretRow) {
  JWT_SECRET = JSON.parse(secretRow.value)
} else {
  JWT_SECRET = randomBytes(32).toString('hex')
  stmtUpsert.run('holysec_jwt_secret', JSON.stringify(JWT_SECRET))
}

// ─── NUTZER AUS ENV ───────────────────────────────────────────────────────────

// Format in .env: HOLYSEC_USERS=[{"memberId":"u001","email":"...","password":"..."}]
function getStaticUsers() {
  try {
    return JSON.parse(process.env.HOLYSEC_USERS || '[]')
  } catch {
    console.error('[holySec] HOLYSEC_USERS konnte nicht geparst werden — keine statischen Nutzer geladen.')
    return []
  }
}

function getAllUsers() {
  const row = stmtGet.get('holysec_users_auth')
  const custom = row ? JSON.parse(row.value) : []
  const staticUsers = getStaticUsers()
  const customEmails = new Set(custom.map(u => u.email))
  const staticFiltered = staticUsers.filter(u => !customEmails.has(u.email))
  return [...staticFiltered, ...custom]
}

// ─── JWT MIDDLEWARE ───────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET)
    next()
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token abgelaufen' : 'Ungültiges Token'
    return res.status(401).json({ error: msg })
  }
}

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 10,                   // max 10 Versuche pro IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Zu viele Login-Versuche. Bitte in 15 Minuten erneut versuchen.' },
})

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: ALLOWED_ORIGIN,
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '20mb' }))

// ─── STATIC FRONTEND ──────────────────────────────────────────────────────────

if (fs.existsSync(DIST_PATH)) {
  app.use('/holySec', express.static(DIST_PATH))
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort erforderlich.' })
  }

  const users = getAllUsers()
  const user = users.find(u => u.email === email && u.password === password)

  if (!user) {
    return res.status(401).json({ error: 'Ungültige Zugangsdaten.' })
  }

  const token = jwt.sign(
    { memberId: user.memberId, email: user.email },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  res.json({ token, memberId: user.memberId })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(req.user)
})

// ─── PROTECTED API ROUTES ─────────────────────────────────────────────────────

app.get('/api/state', requireAuth, (req, res) => {
  const rows = stmtAll.all()
  const state = {}
  for (const row of rows) {
    if (row.key === 'holysec_jwt_secret') continue
    state[row.key] = parseRow(row)
  }
  res.json(state)
})

app.get('/api/kv/:key', requireAuth, (req, res) => {
  if (req.params.key === 'holysec_jwt_secret') return res.status(403).json({ error: 'Forbidden' })
  const row = stmtGet.get(req.params.key)
  res.json(parseRow(row))
})

app.put('/api/kv/:key', requireAuth, (req, res) => {
  if (req.params.key === 'holysec_jwt_secret') return res.status(403).json({ error: 'Forbidden' })
  stmtUpsert.run(req.params.key, JSON.stringify(req.body))
  res.json({ ok: true })
})

app.delete('/api/kv/:key', requireAuth, (req, res) => {
  if (req.params.key === 'holysec_jwt_secret') return res.status(403).json({ error: 'Forbidden' })
  stmtDelete.run(req.params.key)
  res.json({ ok: true })
})

// ─── SPA FALLBACK ─────────────────────────────────────────────────────────────

const INDEX_PATH = path.join(DIST_PATH, 'index.html')

app.get('/', (req, res) => res.redirect('/holySec/'))

app.get('/holySec/*', (req, res) => {
  if (fs.existsSync(INDEX_PATH)) {
    res.sendFile(INDEX_PATH)
  } else {
    res.status(503).send('Frontend not built. Run: npm run build')
  }
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
    console.log(`  JWT-Auth: aktiv  |  Token-Laufzeit: 8h`)
    console.log(`  ─────────────────────────────────────────────────\n`)
  } catch {
    console.log(`\n  HolySec läuft auf: http://localhost:${PORT}/holySec/\n`)
  }
})
