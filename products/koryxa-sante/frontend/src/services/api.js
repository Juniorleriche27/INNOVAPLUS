const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '') || 'http://localhost:8080/sante'

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(()=>'')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  async get(path) {
    const url = `${BASE}${path}`
    return handle(await fetch(url, { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' }))
  },
  async post(path, body) {
    const url = `${BASE}${path}`
    return handle(await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body||{}) }))
  }
}

