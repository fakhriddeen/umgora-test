import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { generateMembershipId } from '@/lib/id-generator'

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

    const { name, surname, social, email, passcode, member_id } = session.metadata

    const supabase = createAdminClient()

    // Generate a unique alphanumeric ID
    let membershipId = '';
    try {
      membershipId = await generateMembershipId(supabase);
    } catch (err) {
      console.error('Failed to generate unique membership ID:', err);
      return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 });
    }

    // Check if email already registered
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let memberId = member_id || existing?.id;

    let hashedPasscode = undefined;

    // If new user, create Auth
    if (!memberId) {
      // 1. Create User in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: passcode,
        email_confirm: true,
      });

      if (authError) {
        console.error('Failed to create Auth user:', authError.message);
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const match = existingUser?.users.find(u => u.email === email);
        if (match) memberId = match.id;
      } else {
        memberId = authData.user.id;
      }

      // 2. Hash the passcode
      hashedPasscode = await bcrypt.hash(passcode, 12);
    }

    // 3. Save the placement to the members table
    const { error: memberError } = await supabase.from('members').insert({
      ...(memberId && !existing?.id ? { id: memberId } : {}), // Only force ID if it's the master account
      membership_number: membershipId,
      name,
      surname,
      email,
      social_handle: social || null,
      stripe_payment_id: session.id,
      ...(session.payment_status ? { payment_status: session.payment_status } : {}),
      ...(hashedPasscode ? { passcode: hashedPasscode } : {}),
      created_at: new Date().toISOString(),
    });

    if (memberError) {
      console.error('Failed to save member:', memberError);
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
    }

    console.log(`New placement saved for ${email} — ID: ${membershipId}`);
  }

  return NextResponse.json({ received: true })
}
