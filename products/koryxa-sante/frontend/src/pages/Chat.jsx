import { useState } from 'react'
import { api } from '../services/api'

export default function Chat() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onAsk(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/chat', { question, top_k: 4 })
      setAnswer(res.answer || '')
      setSources(res.sources || [])
    } catch (err) {
      setError(err.message || 'Erreur chat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h2>Chat (RAG)</h2>
      <form className="card" onSubmit={onAsk}>
        <label>Question</label>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} required />
        <button className="btn" disabled={loading}>{loading ? 'En cours…' : 'Poser la question'}</button>
      </form>
      {error && <div className="card error">{error}</div>}
      {answer && (
        <div className="card">
          <h3>Réponse</h3>
          <pre>{answer}</pre>
        </div>
      )}
      {sources?.length > 0 && (
        <div className="card">
          <h3>Sources</h3>
          <ul>
            {sources.map((s, i) => (
              <li key={i}><code>{s.doc_id}</code> · chunk #{s.chunk_id} · score {s.score?.toFixed?.(3)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

