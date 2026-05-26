function handle401() {
  window.dispatchEvent(new Event('holysec:unauthorized'))
}

export async function apiLogin(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen.')
  return data.memberId
}

export async function apiLogout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function apiState() {
  try {
    const res = await fetch('/api/state', { credentials: 'include' })
    if (res.status === 401) { handle401(); return null }
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
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
