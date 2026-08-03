'use server';
import { createClient } from '@supabase/supabase-js';

export async function syncAndFetchMember(email: string, authUserId: string) {
  // Use the Service Role Key to bypass RLS for this specific linking task
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Forcefully link the auth user ID to the member record where the email matches
  await supabaseAdmin
    .from('members')
    .update({ id: authUserId })
    .eq('email', email);

  // 2. Fetch the newly linked record
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('*')
    .eq('id', authUserId)
    .single();

  return member;
}
