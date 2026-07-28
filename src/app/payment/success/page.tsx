'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Member {
  id: string
  membership_number: string
  name: string
  surname: string
  email: string
  social_handle: string | null
  created_at: string
}

function formatMemberNumber(num: string): string {
  // Format as XXXX·XXX·XXX
  return `${num.slice(0,4)} · ${num.slice(4,7)} · ${num.slice(7,10)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!sessionId) {
      router.replace('/')
      return
    }

    // Poll for member record (webhook may take a few seconds)
    async function fetchMember() {
      try {
        const res = await fetch(`/api/member?session_id=${sessionId}`)
        const data = await res.json()

        if (res.ok && data.member) {
          setMember(data.member)
          setLoading(false)
          // Store in localStorage for dashboard persistence
          localStorage.setItem('umgora_member', JSON.stringify(data.member))
          return true
        }

        if (data.pending && attempts < 8) {
          return false // will retry
        }

        setError('We could not locate your membership record. Please contact support.')
        setLoading(false)
        return true
      } catch {
        setError('Network error. Please try again.')
        setLoading(false)
        return true
      }
    }

    let pollCount = 0
    const poll = async () => {
      const done = await fetchMember()
      if (!done && pollCount < 8) {
        pollCount++
        setAttempts(pollCount)
        setTimeout(poll, 2000)
      }
    }

    poll()
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="page-loader" role="status" aria-label="Loading your membership">
        <div className="page-loader-inner">
          <p className="loader-brand">UMGORA</p>
          <div className="loader-bar">
            <div className="loader-bar-fill" />
          </div>
          <p style={{
            fontSize: '0.72rem',
            color: 'var(--color-charcoal-muted)',
            letterSpacing: '0.08em',
            marginTop: '0.5rem',
          }}>
            {attempts > 0 ? `Confirming payment${'.'.repeat(Math.min(attempts, 3))}` : 'Verifying payment…'}
          </p>
        </div>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div className="success-page">
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(184, 85, 85, 0.1)',
          border: '1px solid rgba(184, 85, 85, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto var(--space-xl)',
        }}>
          ⚠️
        </div>
        <h1 className="success-title" style={{ fontSize: '2rem' }}>Something went wrong</h1>
        <p className="success-subtitle">{error}</p>
        <button
          onClick={() => router.push('/')}
          style={{ marginTop: '2rem', cursor: 'pointer', color: 'var(--color-champagne)', fontSize: '0.8rem', letterSpacing: '0.1em', background: 'none', border: 'none' }}
        >
          ← Return to UMGORA
        </button>
      </div>
    )
  }

  return (
    <div className="success-page">
      <div className="success-icon" aria-hidden="true">✦</div>
      <h1 className="success-title">Welcome to<br />UMGORA</h1>
      <p className="success-subtitle" style={{ opacity: 0, animation: 'fadeUp 0.6s 0.6s forwards' }}>
        {member.name}, your membership has been confirmed. Your exclusive place is secured.
      </p>

      <div style={{
        margin: 'var(--space-2xl) 0',
        opacity: 0,
        animation: 'fadeUp 0.6s 0.8s forwards',
        width: '100%',
        maxWidth: '480px',
      }}>
        {/* VIP Card Preview */}
        <div className="vip-card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="vip-card-top">
            <span className="vip-card-brand">UMGORA</span>
            <span className="vip-card-type">VIP Member</span>
          </div>
          <div className="vip-card-number-section">
            <p className="vip-card-number-label">Membership Number</p>
            <p className="vip-card-number">{formatMemberNumber(member.membership_number)}</p>
          </div>
          <div className="vip-card-bottom">
            <div>
              <p className="vip-card-member-name">{member.name} {member.surname}</p>
              <p className="vip-card-member-since">Member since {formatDate(member.created_at)}</p>
            </div>
            <div className="vip-card-chip">
              <div className="vip-card-chip-lines">
                <span /><span /><span />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
        opacity: 0, animation: 'fadeUp 0.6s 1.2s forwards',
      }}>
        <button
          id="btn-go-dashboard"
          onClick={() => router.push('/dashboard')}
          className="btn-cta"
          style={{ fontSize: '0.72rem', padding: '0.875rem 2rem' }}
        >
          View Dashboard
          <span className="btn-cta-arrow">→</span>
        </button>
        <button
          onClick={() => router.push('/')}
          style={{
            fontSize: '0.72rem', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--color-charcoal-muted)',
            background: 'none', border: '1px solid var(--color-silver-light)',
            borderRadius: 'var(--radius-full)', padding: '0.875rem 2rem',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          Return Home
        </button>
      </div>
    </div>
  )
}
