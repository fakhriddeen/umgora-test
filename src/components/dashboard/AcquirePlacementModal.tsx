'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

interface AcquirePlacementModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
}

export default function AcquirePlacementModal({ isOpen, onClose, memberId }: AcquirePlacementModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    social: ''
  })

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const passcode = Math.random().toString(36).slice(-10) + 'Xyz!'

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          social: formData.social,
          passcode: passcode,
          member_id: memberId, // Pass the master account ID to flag as an additional placement
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize checkout')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div 
        style={{
          background: '#FDFBF7',
          width: '100%',
          maxWidth: '480px',
          borderRadius: '1rem', // rounded-2xl
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-2xl
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#1a1a1a',
            padding: '0.25rem',
            display: 'flex',
            transition: 'color 0.3s ease',
            opacity: 0.5,
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{
              display: 'block',
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#B89B5E',
              marginBottom: '0.75rem'
            }}>
              Expand Your Circle
            </span>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              color: '#1a1a1a',
              margin: 0,
              lineHeight: 1.2
            }}>
              Acquire Additional Placement
            </h2>
            <p style={{
              fontSize: '0.8rem',
              color: 'rgba(26, 26, 26, 0.6)',
              marginTop: '1rem',
              lineHeight: 1.6
            }}>
              Secure an additional placement for a partner, team member, or alias.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#B89B5E',
                  marginBottom: '0.5rem',
                  fontWeight: 500
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid #E8E6E1',
                    borderRadius: '0.5rem',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem',
                    color: '#1a1a1a',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B89B5E'}
                  onBlur={(e) => e.target.style.borderColor = '#E8E6E1'}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#B89B5E',
                  marginBottom: '0.5rem',
                  fontWeight: 500
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.surname}
                  onChange={e => setFormData({ ...formData, surname: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid #E8E6E1',
                    borderRadius: '0.5rem',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.95rem',
                    color: '#1a1a1a',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B89B5E'}
                  onBlur={(e) => e.target.style.borderColor = '#E8E6E1'}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#B89B5E',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid #E8E6E1',
                  borderRadius: '0.5rem',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  color: '#1a1a1a',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#B89B5E'}
                onBlur={(e) => e.target.style.borderColor = '#E8E6E1'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#B89B5E',
                marginBottom: '0.5rem',
                fontWeight: 500
              }}>
                Social Handle (Optional)
              </label>
              <input
                type="text"
                placeholder="@username"
                value={formData.social}
                onChange={e => setFormData({ ...formData, social: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid #E8E6E1',
                  borderRadius: '0.5rem',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                  color: '#1a1a1a',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#B89B5E'}
                onBlur={(e) => e.target.style.borderColor = '#E8E6E1'}
              />
            </div>

            {error && (
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--color-error, #dc2626)',
                margin: 0,
                textAlign: 'center'
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                background: '#111111',
                color: '#FDFBF7',
                border: '1px solid rgba(184, 155, 94, 0.3)',
                padding: '1.1rem',
                borderRadius: '0.5rem',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8rem',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.borderColor = '#B89B5E';
              }}
              onMouseOut={(e) => {
                if (!loading) e.currentTarget.style.borderColor = 'rgba(184, 155, 94, 0.3)';
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                'Proceed to Payment - $99.00'
              )}
            </button>
          </form>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: rgba(26, 26, 26, 0.3);
        }
      `}} />
    </div>
  )
}
