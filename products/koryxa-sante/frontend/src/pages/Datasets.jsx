import { useState } from 'react'
import { api } from '../services/api'

export default function Datasets() {
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('note,fr')
  const [ok, setOk] = useState('')
  const [error, setError] = useState('')

  async function onIngest(e) {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      const res = await api.post('/ingest', {
        source: 'note',
        content,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      setOk(`doc_id=${res.doc_id}, chunks=${res.chunks_indexed}`)
      setContent('')
    } catch (err) {
      setError(err.message || 'Erreur ingestion')
    }
  }

  return (
    <div className="container">
      <h2>Ingestion</h2>
      <form className="card" onSubmit={onIngest}>
        <label>Contenu</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} required />
        <label>Tags (csv)</label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} />
        <button className="btn">Indexer</button>
      </form>
      {ok && <div className="card success">{ok}</div>}
      {error && <div className="card error">{error}</div>}
    </div>
  )
}

