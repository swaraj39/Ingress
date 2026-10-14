import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || ''
const APP_NAME = import.meta.env.VITE_APP_NAME || 'Ingress Demo'

export default function App() {
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_URL}/api/message`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setMessage(data)

        const healthResponse = await fetch(`${API_URL}/api/health`)
        if (healthResponse.ok) {
          const healthData = await healthResponse.json()
          setHealth(healthData)
        }
      } catch (err) {
        setError(err.message)
        console.error('Failed to fetch from backend:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>{APP_NAME}</h1>
        <p className="subtitle">
          Spring Boot + React + Kubernetes Ingress Demo
        </p>
      </header>

      <main className="app-main">

        <section className="card status-card">
          <h2>Backend Status</h2>
          {health ? (
            <div className="status-row">
              <span className="status-badge online">● {health.status}</span>
              <span className="status-detail">
                Service: {health.service} | Time: {new Date(health.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <p className="muted">Health data not available yet.</p>
          )}
        </section>

        <section className="card message-card">
          <h2>Message from Backend</h2>

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Fetching message from Spring Boot via Ingress...</p>
            </div>
          )}

          {error && (
            <div className="error-box">
              <h3>⚠️ Connection Error</h3>
              <p>{error}</p>
              <p className="muted">
                Make sure the backend is running:
                <br />
                <code>cd backend && mvn spring-boot:run</code>
                <br />
                or via Docker Compose / Kubernetes.
              </p>
            </div>
          )}

          {message && (
            <div className="message-content">
              <p className="message-text">"{message.text}"</p>
              <div className="message-meta">
                <span className="meta-item">
                  <strong>Source:</strong> {message.source}
                </span>
                <span className="meta-item">
                  <strong>Time:</strong> {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="card info-card">
          <h2>How Ingress Routing Works</h2>
          <div className="info-content">
            <div className="info-item">
              <span className="info-icon">🌐</span>
              <div>
                <h3>1. Request Enters Ingress</h3>
                <p>
                  The browser sends a request to the domain (e.g.,
                  <code> myapp.example.com/api/message</code>). The Ingress
                  Controller (usually NGINX) receives it.
                </p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🔀</span>
              <div>
                <h3>2. Path-Based Routing</h3>
                <p>
                  Ingress rules match the request path:
                  <code> /api/*</code> → backend Service,
                  <code> /*</code> → frontend Service.
                  One domain, multiple services.
                </p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">☸️</span>
              <div>
                <h3>3. Kubernetes Services</h3>
                <p>
                  Each Service provides a stable virtual IP and load-balances
                  traffic across the running Pods of each Deployment.
                </p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">📦</span>
              <div>
                <h3>4. Pods Respond</h3>
                <p>
                  Spring Boot returns JSON; React (served by nginx) returns
                  HTML/JS/CSS. The browser receives a complete experience from
                  one domain.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Built with Spring Boot · React · Kubernetes Ingress
        </p>
      </footer>
    </div>
  )
}
