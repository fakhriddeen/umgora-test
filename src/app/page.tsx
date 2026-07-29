import { cookies } from 'next/headers'
import LandingClient from '@/components/LandingClient'

export default async function LandingPage() {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.has('umgora_admin')
  const isMember = cookieStore.has('umgora_member')
  const isAuthenticated = isAdmin || isMember

  return (
    <LandingClient 
      isAuthenticated={isAuthenticated} 
      isAdmin={isAdmin} 
    />
  )
}
