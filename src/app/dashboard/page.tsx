'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  return `${num.slice(0,4)} · ${num.slice(4,7)} · ${num.slice(7,10)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load member from localStorage
    const stored = localStorage.getItem('umgora_member')
    if (stored) {
      try {
        setMember(JSON.parse(stored))
      } catch {
        // Invalid data
      }
    }
    setLoading(false)
  }, [])

  function handleSignOut() {
    localStorage.removeItem('umgora_member')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="page-loader" role="status">
        <div className="page-loader-inner">
          <p className="loader-brand">UMGORA</p>
          <div className="loader-bar"><div className="loader-bar-fill" /></div>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="page-loader">
        <div className="page-loader-inner" style={{ textAlign: 'center', gap: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', letterSpacing: '0.2em', color: 'var(--color-charcoal)' }}>
            UMGORA
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-muted)', maxWidth: '280px', lineHeight: 1.7 }}>
            No membership found. Please complete the registration and payment process first.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-login"
            style={{ margin: '0 auto' }}
          >
            Return to UMGORA
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {/* Dashboard Header */}
      <header className="dashboard-header">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="dashboard-nav-brand" style={{ cursor: 'pointer' }}>UMGORA</span>
        </Link>
        <div className="dashboard-nav-right" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span className="dashboard-greeting">Welcome, {member.name}</span>
          <Link href="/" style={{
            fontSize: '0.68rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-charcoal-muted)',
            textDecoration: 'none'
          }}>
            Home
          </Link>
          <button
            id="btn-dashboard-signout"
            className="btn-signout"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="dashboard-content" id="dashboard-main">
        {/* Welcome */}
        <div className="dashboard-welcome">
          <p className="dashboard-welcome-eyebrow">Member Portal</p>
          <h1 className="dashboard-welcome-title">
            Welcome back,<br />
            <em>{member.name}</em>
          </h1>
        </div>

        {/* VIP CARD */}
        <div
          className="vip-card"
          role="region"
          aria-label="Digital VIP Membership Card"
        >
          <div className="vip-card-top">
            <span className="vip-card-brand">UMGORA</span>
            <span className="vip-card-type">VIP Member</span>
          </div>

          <div className="vip-card-number-section">
            <p className="vip-card-number-label">Membership Number</p>
            <p
              className="vip-card-number"
              id="membership-number-display"
              aria-label={`Membership number: ${member.membership_number}`}
            >
              {formatMemberNumber(member.membership_number)}
            </p>
            <p className="vip-card-number-formatted">
              #{member.membership_number}
            </p>
          </div>

          <div className="vip-card-bottom">
            <div>
              <p className="vip-card-member-name">
                {member.name.toUpperCase()} {member.surname.toUpperCase()}
              </p>
              <p className="vip-card-member-since">
                Member since {formatDate(member.created_at)}
              </p>
            </div>
            <div className="vip-card-chip" aria-hidden="true">
              <div className="vip-card-chip-lines">
                <span /><span /><span />
              </div>
            </div>
          </div>
        </div>

        {/* Member Info Grid */}
        <section aria-label="Membership details">
          <div className="member-info-grid">
            <div className="member-info-card">
              <p className="member-info-label">Full Name</p>
              <p className="member-info-value">{member.name} {member.surname}</p>
            </div>

            <div className="member-info-card">
              <p className="member-info-label">Email</p>
              <p className="member-info-value" style={{ wordBreak: 'break-all' }}>
                {member.email}
              </p>
            </div>

            <div className="member-info-card">
              <p className="member-info-label">Social Handle</p>
              <p className="member-info-value">
                {member.social_handle || (
                  <span style={{ color: 'var(--color-silver-dark)', fontStyle: 'italic' }}>
                    Not provided
                  </span>
                )}
              </p>
            </div>

            <div className="member-info-card">
              <p className="member-info-label">Member Since</p>
              <p className="member-info-value">{formatDate(member.created_at)}</p>
            </div>

            <div className="member-info-card">
              <p className="member-info-label">Membership Status</p>
              <p className="member-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--color-success)', display: 'inline-block'
                }} />
                Active
              </p>
            </div>

            <div className="member-info-card">
              <p className="member-info-label">Membership ID</p>
              <p className="member-info-value" style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                letterSpacing: '0.1em',
                color: 'var(--color-champagne)',
              }}>
                #{member.membership_number}
              </p>
            </div>
          </div>
        </section>

        {/* Footer note */}
        <div style={{
          marginTop: 'var(--space-2xl)',
          padding: 'var(--space-lg) var(--space-xl)',
          background: 'rgba(201, 169, 110, 0.05)',
          borderLeft: '2px solid rgba(201, 169, 110, 0.3)',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--color-charcoal-muted)',
            lineHeight: 1.8,
            fontWeight: 300,
          }}>
            Your UMGORA membership is permanent and non-transferable. Your 10-digit membership number is your unique identifier within the circle. Keep it private.
          </p>
        </div>
      </main>
    </div>
  )
}
