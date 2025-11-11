import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function Health() {
  const [data, setData] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    api.get('/health')
      .then((d) => setData(d))
      .catch((e) => setError(e.message || 'Erreur'))
  }, [])

  return (
    <div className="container">
      <h2>Health</h2>
      {error ? (
        <div className="card error">{error}</div>
      ) : (
        <pre className="card small">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  )
}

