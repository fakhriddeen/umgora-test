'use client'

import { useState, useEffect, useRef } from 'react'

const TICKER_ITEMS = [
  { user: '@aleksandra.v', action: 'just claimed their place' },
  { user: '@james_moreau', action: 'just joined the circle' },
  { user: '@nadia.k', action: 'just claimed their place' },
  { user: '@el.hassan', action: 'just secured membership' },
  { user: '@sofia.r', action: 'just joined the circle' },
  { user: '@marcus.lb', action: 'just claimed their place' },
  { user: '@yuki.tanaka', action: 'just secured membership' },
  { user: '@laila.m', action: 'just joined the circle' },
]

export default function SocialTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % TICKER_ITEMS.length)
        setIsVisible(true)
      }, 400)
    }, 3800)
    return () => clearInterval(interval)
  }, [])

  const item = TICKER_ITEMS[currentIndex]

  return (
    <div
      className="social-ticker"
      style={{
        opacity: isVisible ? 0.75 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div className="ticker-dot" />
      <div className="ticker-silhouette" aria-hidden="true">
        <svg width="14" height="16" viewBox="0 0 10 12" fill="none">
          <circle cx="5" cy="3.5" r="2.5" fill="rgba(100,100,95,0.6)" />
          <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" fill="rgba(100,100,95,0.4)" />
        </svg>
      </div>
      <span className="ticker-item">
        <strong style={{ fontWeight: 500, color: 'var(--color-charcoal-soft)' }}>
          {item.user}
        </strong>
        &nbsp;{item.action}
      </span>
    </div>
  )
}
