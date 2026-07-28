import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Hardcoded admin credentials — server-side only, never exposed to client
const ADMIN_EMAIL = 'admin@umgora.com'
const ADMIN_PASSWORD = 'Umgora202*6*00'

export async function POST(req: NextRequest) {
  try {
    const { email, password, passcode } = await req.json()

    // ── Admin login ──────────────────────────────────────────────
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ success: true, role: 'admin' })
      response.cookies.set('umgora_admin', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      })
      return response
    }

    // ── Member login (email + passcode) ──────────────────────────
    if (email && passcode) {
      const supabase = createAdminClient()

      const { data: member } = await supabase
        .from('members')
        .select('id, email, passcode, membership_number, name, surname, social_handle, created_at')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (!member) {
        return NextResponse.json({ error: 'Invalid email or passcode.' }, { status: 401 })
      }

      const isValid = await bcrypt.compare(passcode, member.passcode)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or passcode.' }, { status: 401 })
      }

      // Strip the stored hash before sending to client
      const { passcode: _hash, ...memberData } = member

      const response = NextResponse.json({ success: true, role: 'member', member: memberData })
      response.cookies.set('umgora_member', member.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })
      return response
    }

    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

// Admin data fetch endpoint
export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get('umgora_admin')
  if (!adminCookie || adminCookie.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ members: data })
}

export async function DELETE(req: NextRequest) {
  const adminCookie = req.cookies.get('umgora_admin')
  if (!adminCookie || adminCookie.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('umgora_admin')
  return response
}
