import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { validateEmail } from '@/lib/validation';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
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

  const responseCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            responseCookies.push({ name, value, options });
          });
        },
      },
    }
  );

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

  const response = NextResponse.json({ success: true });
  responseCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
