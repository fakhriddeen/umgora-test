import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Generate a unique 10-digit number
function generateMembershipNumber(): string {
  const num = Math.floor(1000000000 + Math.random() * 9000000000)
  return num.toString()
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as unknown as {
      id: string;
      metadata: Record<string, string>;
      payment_status: string;
    }

    const { name, surname, social, email, passcode } = session.metadata

    const supabase = createAdminClient()

    // Generate a unique 10-digit membership number (collision-safe)
    let membershipNumber = ''
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      membershipNumber = generateMembershipNumber()
      const { data } = await supabase
        .from('members')
        .select('membership_number')
        .eq('membership_number', membershipNumber)
        .single()

      if (!data) isUnique = true
      attempts++
    }

    if (!isUnique) {
      console.error('Failed to generate unique membership number after 10 attempts')
      return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 })
    }

    // Check if email already registered (avoid duplicates)
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      console.log('Member already exists for email:', email)
      return NextResponse.json({ received: true })
    }

    // Hash the passcode before storing
    const hashedPasscode = await bcrypt.hash(passcode, 12)

    // Save to database
    const { error } = await supabase.from('members').insert({
      membership_number: membershipNumber,
      name,
      surname,
      email,
      social_handle: social || null,
      stripe_payment_id: session.id,
      payment_status: session.payment_status,
      passcode: hashedPasscode,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to save member:', error)
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
    }

    console.log(`New member saved: ${name} ${surname} — ID: ${membershipNumber}`)
  }

  return NextResponse.json({ received: true })
}
