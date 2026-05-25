const BASE = ''
const TOKEN_KEY = 'holysec_jwt'

// ─── Token-Verwaltung ─────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handle401() {
  setToken(null)
  window.dispatchEvent(new Event('holysec:unauthorized'))
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen.')
  setToken(data.token)
  return data.memberId
}

// ─── KV-Store ─────────────────────────────────────────────────────────────────

export async function apiState() {
  try {
    const res = await fetch(`${BASE}/api/state`, { headers: authHeaders() })
    if (res.status === 401) { handle401(); return null }
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function apiPut(key, value) {
  try {
    const res = await fetch(`${BASE}/api/kv/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(value),
    })
    if (res.status === 401) handle401()
  } catch {
    // Backend nicht erreichbar — localStorage ist der Fallback
  }
}

export async function apiDelete(key) {
  try {
    const res = await fetch(`${BASE}/api/kv/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.status === 401) handle401()
  } catch {
    // ignore
  }
}
