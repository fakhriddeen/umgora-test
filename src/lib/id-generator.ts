import { SupabaseClient } from '@supabase/supabase-js';

function generateRandomString(length: number, characters: string): string {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function createRawId(): string {
  // We need exactly 4 uppercase letters and 6 numbers
  const letters = generateRandomString(4, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const numbers = generateRandomString(6, '0123456789');
  
  // Combine them into an array of characters
  const combined = (letters + numbers).split('');
  
  // Shuffle the array
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  
  // Format it as XXXX-XXXX-XX or XXXX·XXX·XXX to fit 10 chars.
  // The user gave examples: AB12-3456-CD or A7X9-B241-K0
  // Note: hyphens are 2 extra chars. So the raw string length is 10.
  return combined.join('');
}

const MAX_RETRIES = 3;

export async function generateMembershipId(supabase: SupabaseClient, retries = 0): Promise<string> {
  if (retries >= MAX_RETRIES) {
    throw new Error('Database schema cache error - could not verify ID after maximum retries');
  }

  const rawId = createRawId();
  
  try {
    // Verify against members table
    const { data, error } = await supabase
      .from('members')
      .select('membership_number')
      .eq('membership_number', rawId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, which means the ID is unique
        return rawId;
      }
      if (error.code === 'PGRST205') {
        console.warn(`Schema cache error (PGRST205) caught during ID generation. Retrying (${retries + 1}/${MAX_RETRIES})...`);
        // Wait a brief moment to allow schema cache to clear if possible, then retry
        await new Promise(res => setTimeout(res, 500));
        return generateMembershipId(supabase, retries + 1);
      }
      console.error("Error checking ID uniqueness:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // If data exists, this ID is taken. Recursively generate a new one.
    if (data) {
      return generateMembershipId(supabase, retries + 1);
    }
  } catch (err) {
    console.error("Fatal error during ID generation:", err);
    throw err;
  }

  return rawId;
}
