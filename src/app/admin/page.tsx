'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Place {
  id: string
  membership_number: string
  first_name: string | null
  last_name: string | null
  email: string | null
  social_handle: string | null
  created_at: string
  members: {
    email: string
    payment_status: string
    stripe_payment_id: string | null
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminPage() {
  const router = useRouter()
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPlaces()
  }, [])

  async function fetchPlaces() {
    try {
      const res = await fetch('/api/admin')
      if (res.status === 401) {
        router.replace('/login')
        return
      }
      const data = await res.json()
      if (res.ok) {
        setPlaces(data.members || [])
      } else {
        setError(data.error || 'Failed to load places')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined' && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out of Supabase:', err);
    }

    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();

      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Optional: still call the backend to clear server-side session if needed
      await fetch('/api/admin', { method: 'DELETE' }).catch(() => {});

      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="page-loader-inner">
          <p className="loader-brand" style={{ color: 'var(--color-champagne-light)' }}>UMGORA</p>
          <div className="loader-bar" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="loader-bar-fill" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Admin Header */}
      <header className="admin-header">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="admin-brand" style={{ cursor: 'pointer' }}>
            <span className="admin-brand-name">UMGORA</span>
            <span className="admin-badge">Admin</span>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(250,249,246,0.4)', letterSpacing: '0.06em' }}>
            admin@umgora.com
          </span>
          <Link href="/" style={{
            fontSize: '0.68rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(250, 249, 246, 0.5)',
            textDecoration: 'none'
          }}>
            Home
          </Link>
          <button
            id="btn-admin-signout"
            onClick={handleSignOut}
            style={{
              fontSize: '0.68rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(250, 249, 246, 0.5)',
              padding: '4px 12px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(184, 85, 85, 0.5)'
              ;(e.target as HTMLButtonElement).style.color = 'rgba(184, 85, 85, 0.8)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
              ;(e.target as HTMLButtonElement).style.color = 'rgba(250, 249, 246, 0.5)'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="admin-content" id="admin-main">
        {/* Page Title */}
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <p style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--color-champagne)',
            marginBottom: 'var(--space-sm)',
          }}>
            Control Panel
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 400,
            color: 'var(--color-alabaster)',
          }}>
            Members Overview
          </h1>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <p className="admin-stat-value">{places.length}</p>
            <p className="admin-stat-label">Total Placements</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-value">
              {places.filter(p => p.members?.payment_status === 'paid').length}
            </p>
            <p className="admin-stat-label">Paid Placements</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-value">
              {places.filter(p => p.social_handle).length}
            </p>
            <p className="admin-stat-label">With Social</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-value">
              {places.filter(p => {
                const today = new Date()
                const created = new Date(p.created_at)
                const diff = (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
                return diff <= 30
              }).length}
            </p>
            <p className="admin-stat-label">This Month</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: 'var(--space-md)',
            background: 'rgba(184,85,85,0.1)',
            border: '1px solid rgba(184,85,85,0.2)',
            borderRadius: 'var(--radius-md)',
            color: '#E07070',
            fontSize: '0.82rem',
            marginBottom: 'var(--space-lg)',
          }}>
            {error}
          </div>
        )}

        {/* Members Table */}
        <div className="admin-table-section">
          <div className="admin-table-header">
            <h2 className="admin-table-title">Registered Placements</h2>
            <span className="admin-table-count">{places.length} records</span>
          </div>

          <div className="admin-table-wrap">
            {places.length === 0 ? (
              <div className="admin-empty">
                <div className="admin-empty-icon">◈</div>
                <p style={{ fontSize: '0.82rem', letterSpacing: '0.06em' }}>
                  No placements registered yet
                </p>
              </div>
            ) : (
              <table className="admin-table" aria-label="Registered placements">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Membership ID</th>
                    <th scope="col">Place Name</th>
                    <th scope="col">Place Email</th>
                    <th scope="col">Master Email</th>
                    <th scope="col">Social</th>
                    <th scope="col">Status</th>
                    <th scope="col">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map((place, index) => (
                    <tr key={place.id}>
                      <td style={{ color: 'rgba(250,249,246,0.3)', fontSize: '0.72rem' }}>
                        {index + 1}
                      </td>
                      <td className="membership-number">
                        {place.membership_number.slice(0,4)} · {place.membership_number.slice(4,8)} · {place.membership_number.slice(8,10)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {place.first_name ? `${place.first_name} ${place.last_name || ''}` : <span style={{ color: 'rgba(250,249,246,0.3)' }}>Legacy Auto-sync</span>}
                        </div>
                      </td>
                      <td style={{ color: 'rgba(250,249,246,0.8)' }}>
                        {place.email || <span style={{ color: 'rgba(250,249,246,0.3)' }}>Legacy Auto-sync</span>}
                      </td>
                      <td style={{ color: 'rgba(250,249,246,0.5)', fontSize: '0.8rem' }}>
                        {place.members?.email}
                      </td>
                      <td>
                        {place.social_handle ? (
                          <span style={{ color: 'var(--color-champagne-light)' }}>
                            {place.social_handle}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(250,249,246,0.25)', fontStyle: 'italic' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${place.members?.payment_status === 'paid' ? 'paid' : 'pending'}`}>
                          <span className="status-dot" />
                          {place.members?.payment_status || 'unknown'}
                        </span>
                      </td>
                      <td style={{ color: 'rgba(250,249,246,0.5)', fontSize: '0.78rem' }}>
                        {formatDate(place.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 'var(--space-2xl)',
          textAlign: 'center',
          fontSize: '0.62rem',
          letterSpacing: '0.15em',
          color: 'rgba(250,249,246,0.2)',
        }}>
          UMGORA ADMIN PANEL · CONFIDENTIAL
        </div>
      </main>
    </div>
  )
}
