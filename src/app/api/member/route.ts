import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { generateMembershipId } from '@/lib/id-generator'

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
    
    // Check if this is an additional placement
    if (session.metadata?.member_id) {
      // Poll the places table instead of members
      // The webhook should have inserted the place with this specific email or we check by member_id & email
      const { data: place, error: placeError } = await supabase
        .from('places')
        .select('*')
        .eq('member_id', session.metadata.member_id)
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (placeError || !place) {
        console.log(`Waiting for webhook to process additional placement for member ${session.metadata.member_id}...`);
        return NextResponse.json({ error: 'Data not ready', pending: true }, { status: 202 })
      }
      return NextResponse.json({ member: { isAdditional: true } })
    }

    // ── Regular Member Flow ───────────────────────────────
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error || !member) {
      console.log(`Waiting for webhook to process new member ${email}...`);
      return NextResponse.json({ error: 'Data not ready', pending: true }, { status: 202 })
    }

    return NextResponse.json({ member })
  } catch (err) {
    console.error('Member lookup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
