import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const body = await request.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { success: false, error: { message: 'Email is required.' } },
      { status: 400 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed } = await checkRateLimit(`forgot-password:${ip}`, 3);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many attempts. Please try again later.' } },
      { status: 429 }
    );
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(request.url).origin}/reset-password`,
  });

  if (error) {
    console.error('[forgot-password] Error:', error.message);
  }

  return NextResponse.json({ success: true });
}
