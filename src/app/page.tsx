import { cookies } from 'next/headers'
import LandingClient from '@/components/LandingClient'
import { createClient } from '@supabase/supabase-js'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value
  const isAdmin = cookieStore.has('umgora_admin')

  let isAuthenticated = false;

  if (token) {
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { data: { user } } = await supabaseServer.auth.getUser()
    console.log('[Auth Check] User ID:', user?.id ?? 'No User')
    
    if (user) {
      isAuthenticated = true
    }
  } else {
    console.log('[Auth Check] User ID: No User')
  }

  return (
    <LandingClient 
      isAuthenticated={isAuthenticated || isAdmin} 
      isAdmin={isAdmin} 
    />
  )
}
