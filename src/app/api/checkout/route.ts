import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { name, surname, social, email, passcode, member_id } = await req.json()

    if (!name || !surname || !email || !passcode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    //jst for
    const appUrl = 'https://umgora.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'UMGORA Exclusive Membership',
              description: 'Lifetime exclusive membership with unique 10-digit ID',
              images: [],
            },
            unit_amount: 100, // $1.00 — temporary drop
          },
          quantity: 1,
        },
      ],
      metadata: {
        name,
        surname,
        social: social || '',
        email,
        passcode,
        ...(member_id && { member_id }),
      },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}${member_id ? '&type=additional' : ''}`,
      cancel_url: `${appUrl}/?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
