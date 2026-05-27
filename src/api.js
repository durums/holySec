// ─── Basis ────────────────────────────────────────────────────────────────────

function handle401() {
  window.dispatchEvent(new Event('holysec:unauthorized'))
}

async function req(method, url, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
  }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  if (res.status === 401) { handle401(); return null }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Fehler ${res.status}`)
  return data
}

const get    = (url)        => req('GET',    url)
const post   = (url, body)  => req('POST',   url, body)
const put    = (url, body)  => req('PUT',    url, body)
const del    = (url)        => req('DELETE', url)

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen.')
  return data.memberId
}

export const apiMe     = ()  => get('/api/auth/me')
export const apiLogout = ()  => post('/api/auth/logout')

// ─── Users ────────────────────────────────────────────────────────────────────

export const apiGetUsers         = ()           => get('/api/users')
export const apiCreateUser       = (data)       => post('/api/users', data)
export const apiUpdateUser       = (id, data)   => put(`/api/users/${id}`, data)
export const apiUpdatePassword   = (id, password) => put(`/api/users/${id}/password`, { password })
export const apiDeleteUser       = (id)         => del(`/api/users/${id}`)

// ─── Clients ──────────────────────────────────────────────────────────────────

export const apiGetClients   = ()         => get('/api/clients')
export const apiCreateClient = (data)     => post('/api/clients', data)
export const apiUpdateClient = (id, data) => put(`/api/clients/${id}`, data)
export const apiDeleteClient = (id)       => del(`/api/clients/${id}`)

// ─── Findings ─────────────────────────────────────────────────────────────────

export const apiGetFindings   = (clientId)  => get(clientId ? `/api/findings?clientId=${clientId}` : '/api/findings')
export const apiCreateFinding = (data)      => post('/api/findings', data)
export const apiUpdateFinding = (id, data)  => put(`/api/findings/${id}`, data)
export const apiDeleteFinding = (id)        => del(`/api/findings/${id}`)

// ─── Engagements ──────────────────────────────────────────────────────────────

export const apiGetEngagements   = ()         => get('/api/engagements')
export const apiCreateEngagement = (data)     => post('/api/engagements', data)
export const apiUpdateEngagement = (id, data) => put(`/api/engagements/${id}`, data)
export const apiDeleteEngagement = (id)       => del(`/api/engagements/${id}`)

// ─── Reports ──────────────────────────────────────────────────────────────────

export const apiGetReports   = ()         => get('/api/reports')
export const apiCreateReport = (data)     => post('/api/reports', data)
export const apiUpdateReport = (id, data) => put(`/api/reports/${id}`, data)
export const apiDeleteReport = (id)       => del(`/api/reports/${id}`)

// ─── Time Entries ─────────────────────────────────────────────────────────────

export const apiGetTimeEntries   = ()     => get('/api/time-entries')
export const apiCreateTimeEntry  = (data) => post('/api/time-entries', data)
export const apiDeleteTimeEntry  = (id)   => del(`/api/time-entries/${id}`)

// ─── Engagement Groups ────────────────────────────────────────────────────────

export const apiGetEngGroups   = ()         => get('/api/eng-groups')
export const apiCreateEngGroup = (data)     => post('/api/eng-groups', data)
export const apiUpdateEngGroup = (id, data) => put(`/api/eng-groups/${id}`, data)
export const apiDeleteEngGroup = (id)       => del(`/api/eng-groups/${id}`)

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const apiGetAuditLogs  = (limit)       => get(`/api/audit-logs${limit ? `?limit=${limit}` : ''}`)
export const apiCreateAuditLog = (data)       => post('/api/audit-logs', data)

// ─── Legacy KV (wird nach Frontend-Migration entfernt) ────────────────────────

export async function apiState() {
  try {
    const res = await fetch('/api/state', { credentials: 'include' })
    if (res.status === 401) { handle401(); return null }
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

export async function apiPut(key, value) {
  try {
    const res = await fetch(`/api/kv/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(value),
    })
    if (res.status === 401) handle401()
  } catch {}
}

export async function apiDelete(key) {
  try {
    const res = await fetch(`/api/kv/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.status === 401) handle401()
  } catch {}
}
