import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'

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
      return NextResponse.json({ error: 'Member not found yet', pending: true }, { status: 404 })
    }

    return NextResponse.json({ member })
  } catch (err) {
    console.error('Member lookup error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
