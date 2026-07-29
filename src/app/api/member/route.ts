import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

function generateMembershipNumber(): string {
  const num = Math.floor(1000000000 + Math.random() * 9000000000)
  return num.toString()
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'No session ID' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 })
    }

    const email = session.customer_email || session.metadata?.email
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !member) {
      // ── Fallback Account Creation ───────────────────────────────
      // If webhook missed it, create the user right now on demand.
      const metadata = session.metadata || {}
      const { name, surname, social, passcode } = metadata
      
      if (!name || !surname || !passcode) {
        return NextResponse.json({ error: 'Missing metadata for creation', pending: true }, { status: 404 })
      }

      let membershipNumber = ''
      let isUnique = false
      let attempts = 0
      while (!isUnique && attempts < 10) {
        membershipNumber = generateMembershipNumber()
        const { data } = await supabase.from('members').select('membership_number').eq('membership_number', membershipNumber).single()
        if (!data) isUnique = true
        attempts++
      }

      if (!isUnique) {
        return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 })
      }

      const hashedPasscode = await bcrypt.hash(passcode, 12)

      const newMember = {
        membership_number: membershipNumber,
        name,
        surname,
        email,
        social_handle: social || null,
        stripe_payment_id: session.id,
        payment_status: session.payment_status,
        passcode: hashedPasscode,
        created_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from('members').insert(newMember)

      if (insertError) {
        console.error('Fallback DB insert failed:', insertError)
        return NextResponse.json({ error: 'Member not found yet (insert failed)', pending: true }, { status: 404 })
      }

      console.log(`Fallback member saved: ${name} ${surname} — ID: ${membershipNumber}`)
      
      // Remove hashed passcode before returning to client
      const { passcode: _hash, ...safeMember } = newMember
      return NextResponse.json({ member: safeMember })
    }

    return NextResponse.json({ member })
  } catch (err) {
    console.error('Member lookup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
