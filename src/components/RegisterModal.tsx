'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface RegisterModalProps {
  onClose: () => void
}

interface FormData {
  name: string
  surname: string
  social: string
  email: string
  passcode: string
  agreeTerms: boolean
}

interface FormErrors {
  name?: string
  surname?: string
  email?: string
  passcode?: string
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function RegisterModal({ onClose }: RegisterModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    name: '',
    surname: '',
    social: '',
    email: '',
    passcode: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function validate(data: FormData): FormErrors {
    const errs: FormErrors = {}
    if (!data.name.trim()) errs.name = 'Name is required'
    if (!data.surname.trim()) errs.surname = 'Surname is required'
    if (!data.email.trim()) errs.email = 'Email is required'
    else if (!validateEmail(data.email)) errs.email = 'Please enter a valid email'
    if (!data.passcode) errs.passcode = 'Passcode is required'
    else if (data.passcode.length < 6) errs.passcode = 'Passcode must be at least 6 characters'
    return errs
  }

  const isFormValid =
    form.name.trim() &&
    form.surname.trim() &&
    form.email.trim() &&
    validateEmail(form.email) &&
    form.passcode.length >= 6 &&
    form.agreeTerms

  function handleChange(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (touched[field as string]) {
      const newForm = { ...form, [field]: value }
      const newErrors = validate(newForm)
      setErrors(prev => ({ ...prev, [field]: newErrors[field as keyof FormErrors] }))
    }
  }

  function handleBlur(field: keyof FormData) {
    setTouched(prev => ({ ...prev, [field]: true }))
    const newErrors = validate(form)
    setErrors(prev => ({ ...prev, [field]: newErrors[field as keyof FormErrors] }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ name: true, surname: true, email: true, passcode: true })
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0 || !form.agreeTerms) return

    setLoading(true)
    setServerError('')

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          surname: form.surname.trim(),
          social: form.social.trim(),
          email: form.email.trim(),
          passcode: form.passcode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setServerError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Register for UMGORA membership"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-drawer">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close registration"
        >
          ✕
        </button>

        <div className="modal-header">
          <p className="modal-eyebrow">Membership Registration</p>
          <h2 className="modal-title">Claim Your<br />Place</h2>
          <p className="modal-subtitle">
            A curated membership awaits. Complete the details below to secure your exclusive position.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Name Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">
                  Name <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  className={`form-input${errors.name && touched.name ? ' error' : ''}`}
                  placeholder="First name"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  autoComplete="given-name"
                />
                {errors.name && touched.name && (
                  <span className="form-error-text">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-surname">
                  Surname <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  id="reg-surname"
                  type="text"
                  className={`form-input${errors.surname && touched.surname ? ' error' : ''}`}
                  placeholder="Last name"
                  value={form.surname}
                  onChange={e => handleChange('surname', e.target.value)}
                  onBlur={() => handleBlur('surname')}
                  autoComplete="family-name"
                />
                {errors.surname && touched.surname && (
                  <span className="form-error-text">{errors.surname}</span>
                )}
              </div>
            </div>

            {/* Social Handle */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-social">
                Instagram / TikTok
                <span className="optional"> (optional — if public)</span>
              </label>
              <input
                id="reg-social"
                type="text"
                className="form-input"
                placeholder="@yourusername"
                value={form.social}
                onChange={e => handleChange('social', e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="reg-email"
                type="email"
                className={`form-input${errors.email && touched.email ? ' error' : ''}`}
                placeholder="your@email.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                autoComplete="email"
              />
              {errors.email && touched.email && (
                <span className="form-error-text">{errors.email}</span>
              )}
            </div>

            {/* Passcode */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-passcode">
                Passcode <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-passcode"
                  type={showPasscode ? 'text' : 'password'}
                  className={`form-input${errors.passcode && touched.passcode ? ' error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={form.passcode}
                  onChange={e => handleChange('passcode', e.target.value)}
                  onBlur={() => handleBlur('passcode')}
                  autoComplete="new-password"
                  style={{ paddingRight: '3rem' }}
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
                    padding: '2px 4px',
                  }}
                >
                  {showPasscode ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.passcode && touched.passcode && (
                <span className="form-error-text">{errors.passcode}</span>
              )}
              <span style={{
                fontSize: '0.68rem', color: 'var(--color-charcoal-muted)',
                fontWeight: 300, marginTop: '2px',
              }}>
                You will use this passcode to log in to your member dashboard.
              </span>
            </div>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(to right, transparent, var(--color-silver-light), transparent)',
            }} />

            {/* Terms */}
            <div className="terms-row">
              <input
                id="reg-terms"
                type="checkbox"
                className="terms-checkbox"
                checked={form.agreeTerms}
                onChange={e => handleChange('agreeTerms', e.target.checked)}
              />
              <label htmlFor="reg-terms" className="terms-text">
                I agree to the{' '}
                <span className="terms-link">Terms and Conditions</span>
                {' '}and{' '}
                <span className="terms-link">Privacy Policy</span>.
                I understand this is a non-refundable exclusive membership.
              </label>
            </div>

            {/* Server Error */}
            {serverError && (
              <div style={{
                padding: 'var(--space-md)',
                background: 'rgba(184, 85, 85, 0.08)',
                border: '1px solid rgba(184, 85, 85, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: 'var(--color-error)',
                textAlign: 'center',
              }}>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-proceed-payment"
              type="submit"
              className={`btn-proceed${loading ? ' loading' : ''}`}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <span style={{ visibility: 'hidden' }}>Proceed to Payment</span>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </form>

        <p className="modal-footer-note">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" style={{ opacity: 0.5 }}>
            <rect x="1" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3 5V3.5a3 3 0 016 0V5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Secured by Stripe — your data is encrypted and safe
        </p>
      </div>
    </div>
  )
}
