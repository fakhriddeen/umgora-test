'use client'

import { useState, useEffect } from 'react'
import SocialTicker from '@/components/SocialTicker'
import RegisterModal from '@/components/RegisterModal'
import Link from 'next/link'
import { TextLoop } from '@/components/ui/text-loop'

interface LandingClientProps {
  isAuthenticated: boolean
  isAdmin: boolean
}

export default function LandingClient({ isAuthenticated, isAdmin }: LandingClientProps) {
  const [showModal, setShowModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const portalHref = isAdmin ? '/admin' : '/dashboard'

  // Header Button
  const headerBtnText = isAuthenticated ? (isAdmin ? 'Admin Portal' : 'Dashboard') : 'Log In'
  const headerBtnHref = isAuthenticated ? portalHref : '/login'


  const heroCtaText = isAuthenticated ? (isAdmin ? 'ENTER PORTAL' : 'MEMBER DASHBOARD') : 'Get Place'

  return (
    <div className="landing-bg">
      {/* ── HEADER ───────────────────────────────────── */}
      <header className={`header${scrolled ? ' header-scrolled' : ''}`}>
        <div className="header-logo">UMGORA</div>

        <div className="header-actions">
          <SocialTicker />
          <Link href={headerBtnHref} style={{ textDecoration: 'none' }}>
            <button id="btn-login-header" className="btn-login">
              {headerBtnText}
            </button>
          </Link>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────── */}
      <main className="hero" id="hero">
        <p className="hero-eyebrow">An Exclusive Circle</p>

        <h1 className="hero-brand">
          UMGORA
          <span>Membership</span>
        </h1>

        <div className="hero-divider" />

        <div className="hero-subtitle text-center">
          {isAuthenticated ? (
            <TextLoop className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
              {[
                "Welcome back to the circle.",
                "Your secure portal is ready.",
                "Access your premium benefits.",
                "Connect with the network.",
              ].map((text) => (
                <span key={text} className="block text-center">{text}</span>
              ))}
            </TextLoop>
          ) : (
            <TextLoop className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
              {[
                "A private circle of extraordinary individuals.",
                "Get exclusive access to the platform.",
                "Be part of our inner club.",
                "Membership is by invitation only.",
              ].map((text) => (
                <span key={text} className="block text-center">{text}</span>
              ))}
            </TextLoop>
          )}
        </div>

        <div className="hero-cta-wrap">
          {isAuthenticated ? (
            <Link href={portalHref} style={{ textDecoration: 'none' }}>
              <button
                className="btn-cta"
                aria-label="Enter your portal"
              >
                {heroCtaText}
                <span className="btn-cta-arrow" aria-hidden="true">→</span>
              </button>
            </Link>
          ) : (
            <button
              id="btn-get-place"
              className="btn-cta"
              onClick={() => setShowModal(true)}
              aria-label="Get your membership place"
            >
              {heroCtaText}
              <span className="btn-cta-arrow" aria-hidden="true">→</span>
            </button>
          )}
        </div>

        <div className="hero-scroll-hint" aria-hidden="true">
          <span className="hero-scroll-text">Discover</span>
          <span className="hero-scroll-line" />
        </div>
      </main>

      {/* ── FEATURES STRIP ───────────────────────────── */}
      <section className="features-strip" id="features" aria-label="Membership benefits">
        <article className="feature-card">
          <div className="feature-number">01</div>
          <h3 className="feature-title">Unique Identity</h3>
          <p className="feature-desc">
            Every member receives a permanent, 10-digit membership number. Your digital identity within the circle.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-number">02</div>
          <h3 className="feature-title">Exclusive Access</h3>
          <p className="feature-desc">
            Unlock curated experiences, private events, and a network of individuals who share your standard.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-number">03</div>
          <h3 className="feature-title">Lifetime Status</h3>
          <p className="feature-desc">
            Once a member, always a member. Your place in the UMGORA circle is permanent and non-transferable.
          </p>
        </article>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: 'var(--space-2xl)',
        borderTop: '1px solid rgba(201, 169, 110, 0.1)',
      }}>
        <p style={{
          fontSize: '0.65rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-silver-dark)',
        }}>
          © {new Date().getFullYear()} UMGORA · All Rights Reserved
        </p>
      </footer>

      {/* ── REGISTRATION MODAL ───────────────────────── */}
      {showModal && <RegisterModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
