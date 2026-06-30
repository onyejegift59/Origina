import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateEmail, validatePassword } from '@/lib/validation';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, next } = body;

  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    return NextResponse.json(
      { success: false, error: { message: 'Unable to create account.' } },
      { status: 400 }
    );
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    return NextResponse.json(
      { success: false, error: { message: 'Unable to create account.' } },
      { status: 400 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed } = await checkRateLimit(`signup:${ip}`, 5);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many attempts. Please try again later.' } },
      { status: 429 }
    );
  }

  const supabase = await createServerSupabaseClient();

  const redirectTo = new URL('/auth/callback', request.url);
  if (next) {
    redirectTo.searchParams.set('next', next);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo.toString(),
    },
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: { message: 'Unable to create account.' } },
      { status: 400 }
    );
  }

  if (data.user) {
    const admin = createAdminClient();
    await admin.from('profiles').upsert(
      { id: data.user.id, email: data.user.email ?? email },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  }

  return NextResponse.json({ success: true });
}
