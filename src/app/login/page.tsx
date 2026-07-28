'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !passcode.trim()) return

    setLoading(true)
    setError('')

    try {
      // Send both passcode (member path) and password (admin path uses same field)
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), passcode, password: passcode }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        if (data.role === 'admin') {
          router.push('/admin')
        } else if (data.role === 'member' && data.member) {
          // Persist member data for dashboard
          localStorage.setItem('umgora_member', JSON.stringify(data.member))
          router.push('/dashboard')
        }
        return
      }

      setError(data.error || 'Invalid email or passcode.')
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div>
        <div className="login-card">
          <div className="login-card-header">
            <h1 className="login-brand">UMGORA</h1>
            <p className="login-card-title">Member Login</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="login-card-body">
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-passcode">
                  Passcode
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-passcode"
                    type={showPasscode ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your passcode"
                    value={passcode}
                    onChange={e => setPasscode(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: '3.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(p => !p)}
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--color-silver-dark)', fontSize: '0.72rem',
                      letterSpacing: '0.06em', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {showPasscode ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="btn-login-submit"
                disabled={loading || !email.trim() || !passcode.trim()}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
          <button
            onClick={() => router.push('/')}
            className="back-link"
          >
            ← Return to UMGORA
          </button>
        </div>
      </div>
    </div>
  )
}

