'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    // In our state, 'email' is actually the generic identifier field.
    let identifier = email.trim()
    if (!identifier || !passcode.trim()) return

    setLoading(true)
    setError('')

    try {
      // 1. First, try the Admin hardcoded login (fallback to existing API)
      if (identifier === 'admin@umgora.com') {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier, passcode, password: passcode }),
        })
        const data = await res.json()
        if (res.ok && data.success && data.role === 'admin') {
          window.location.href = '/admin'
          return
        }
      }

      // 1.5 Resolve identifier to email if it's a membership number or handle
      let emailToUse = identifier;
      if (!emailToUse.includes('@')) {
        const { data: memberLookup } = await supabase
          .from('members')
          .select('email')
          .or(`membership_number.eq.${emailToUse},social_handle.eq.${emailToUse}`)
          .maybeSingle();
          
        if (memberLookup?.email) {
          emailToUse = memberLookup.email;
        }
      }

      console.log('[Login Attempt]', { identifier: emailToUse, password: passcode });

      // 2. Member Login via Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: passcode,
      });

      if (authError) {
        console.error("Login failed:", authError.message);
        setError(authError.message);
        return;
      }

      if (data.session) {
        // Explicitly set the cookie for SSR in app/page.tsx
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax; Secure`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax; Secure`;

        // 3. Check Custom Profile in Database
        const authUser = data.session.user;
        const { data: member, error: profileError } = await supabase
          .from('members')
          .select('*')
          .or(`id.eq.${authUser.id},email.eq.${emailToUse}`)
          .maybeSingle();

        if (profileError || !member) {
          console.error("Auth succeeded but custom profile check failed:", profileError);
          // We don't block them entirely, the dashboard syncing state will catch them
        } else {
          // Rewrite the local storage key for legacy components just in case
          localStorage.setItem('umgora_member', JSON.stringify(member));
        }

        // Force hard redirect to hydrate Server Components
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error(err);
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
                  Email, Membership ID, or Handle
                </label>
                <input
                  id="login-email"
                  type="text"
                  className="form-input"
                  placeholder="Enter email or ID"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
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

