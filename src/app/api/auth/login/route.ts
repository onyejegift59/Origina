import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateEmail } from '@/lib/validation';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid email or password.' } },
      { status: 400 }
    );
  }

  if (!password) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid email or password.' } },
      { status: 400 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed } = await checkRateLimit(`login:${ip}`, 10);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many attempts. Please try again later.' } },
      { status: 429 }
    );
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
