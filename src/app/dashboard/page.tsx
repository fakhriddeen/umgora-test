'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { syncAndFetchMember } from '@/app/actions/sync-profile'
import { Copy, Check } from 'lucide-react'
import AcquirePlacementModal from '@/components/dashboard/AcquirePlacementModal'

interface Member {
  id: string
  membership_number: string
  name: string
  surname: string
  email: string
  social_handle: string | null
  created_at: string
}

interface Place {
  id: string
  membership_number: string
  first_name?: string
  last_name?: string
  email?: string
  social_handle?: string | null
  created_at: string
}

function formatMemberNumber(num: string): string {
  if (num.length === 10 && num.match(/^[A-Z0-9]+$/)) {
    return `${num.slice(0,4)} · ${num.slice(4,8)} · ${num.slice(8,10)}`
  }
  return num
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
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'places' | 'account'>('places')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isAcquireModalOpen, setIsAcquireModalOpen] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[Auth Check] User ID:', user?.id ?? 'No User');
        
        if (!user) {
          router.replace('/login');
          return;
        }

        if (user.email) {
          // Attempt standard client fetch first
          let { data: memberRecord } = await supabase
            .from('members')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          // If RLS blocked it because it's unlinked, hit the server action to sync it
          if (!memberRecord) {
            try {
              memberRecord = await syncAndFetchMember(user.email, user.id);
            } catch (err) {
              console.error("Failed to sync profile:", err);
            }
          }

          if (memberRecord) {
            // Populate UI with real data
            setMember(memberRecord);

            // Fetch places
            const { data: placesData } = await supabase
              .from('places')
              .select('*')
              .eq('member_id', user.id)
              .order('created_at', { ascending: true });
            
            if (placesData && placesData.length > 0) {
              setPlaces(placesData);
            } else {
              // Fallback to legacy member.membership_number if places not migrated properly yet
              setPlaces([{
                id: 'legacy',
                membership_number: memberRecord.membership_number,
                created_at: memberRecord.created_at
              }]);
            }
            
            setLoading(false);
          } else {
            // Only fallback if it TRULY doesn't exist in the database
            setMember({
              id: user.id,
              membership_number: 'Pending',
              name: 'Member',
              surname: '',
              email: user.email || '',
              social_handle: null,
              created_at: new Date().toISOString()
            } as Member);
            
            setPlaces([{
              id: 'pending',
              membership_number: 'Pending',
              created_at: new Date().toISOString()
            }]);
            
            setLoading(false);
          }
        }
      } catch (err) {
        console.error(err);
        router.replace('/login');
      }
    }
    
    checkAuth();
  }, [router]);

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

      window.location.href = '/';
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  if (!member) return null;

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

        {/* Tabs Navigation */}
        <div className="dashboard-tabs">
          <button 
            className={`dashboard-tab ${activeTab === 'places' ? 'active' : ''}`}
            onClick={() => setActiveTab('places')}
          >
            My Places
          </button>
          <button 
            className={`dashboard-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'places' && (
          <section aria-label="My Places">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {places.map((place, index) => (
                <div
                  key={place.id || index}
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
                      aria-label={`Membership number: ${place.membership_number}`}
                    >
                      {formatMemberNumber(place.membership_number)}
                    </p>
                    <p className="vip-card-number-formatted">
                      #{place.membership_number}
                    </p>
                  </div>

                  <div className="vip-card-bottom">
                    <div>
                      <p className="vip-card-member-name">
                        {(place.first_name || member.name).toUpperCase()} {(place.last_name || member.surname).toUpperCase()}
                      </p>
                      <p style={{
                        fontSize: '0.58rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'rgba(193, 160, 99, 0.9)',
                        marginTop: '0.35rem',
                        marginBottom: '0.5rem',
                        fontFamily: 'var(--font-sans)',
                      }}>
                        {place.email || member.email}
                      </p>
                      <p className="vip-card-member-since">
                        Member since {formatDate(place.created_at)}
                      </p>
                    </div>
                    <div 
                      className="vip-card-chip" 
                      onClick={() => copyToClipboard(place.membership_number, place.id)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', background: 'transparent' }}
                      title="Copy Membership Number"
                    >
                      {copiedId === place.id ? (
                        <Check size={18} color="var(--color-champagne-dark)" style={{ margin: 'auto' }} />
                      ) : (
                        <Copy size={18} color="var(--color-silver-dark)" style={{ margin: 'auto' }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="btn-acquire-ghost"
              onClick={() => {
                setShowComingSoon(true)
                setTimeout(() => setShowComingSoon(false), 4000)
              }}
            >
              + Acquire Additional Placement
            </button>
            
            {showComingSoon && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(250,249,246,0.05)',
                border: '1px solid rgba(184, 155, 94, 0.5)',
                borderRadius: '0.5rem',
                color: 'var(--color-champagne-light)',
                fontSize: '0.75rem',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}>
                Additional placements are currently paused and will be returning soon.
              </div>
            )}
          </section>
        )}

        {activeTab === 'account' && (
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
                <p className="member-info-label">Account Created</p>
                <p className="member-info-value">{formatDate(member.created_at)}</p>
              </div>

              <div className="member-info-card">
                <p className="member-info-label">Account Status</p>
                <p className="member-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--color-success)', display: 'inline-block'
                  }} />
                  Active
                </p>
              </div>
            </div>
          </section>
        )}

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
            Your UMGORA membership is permanent and non-transferable. Your 10-character membership ID is your unique identifier within the circle. Keep it private.
          </p>
        </div>
      </main>

      <AcquirePlacementModal 
        isOpen={isAcquireModalOpen}
        onClose={() => setIsAcquireModalOpen(false)}
        memberId={member.id}
      />
    </div>
  )
}
