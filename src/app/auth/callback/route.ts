import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

const RESET_LINK_TTL_MS = 30 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const issuedAt = searchParams.get('issued_at');

  if (code) {
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (issuedAt) {
        const elapsed = Date.now() - Number(issuedAt);
        if (elapsed > RESET_LINK_TTL_MS) {
          return NextResponse.redirect(`${origin}/login?error=link_expired`);
        }
      }

      const admin = createAdminClient();
      await admin.from('profiles').upsert(
        { id: data.user.id, email: data.user.email ?? '' },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      if (next === '/reset-password') {
        await admin.auth.admin.updateUserById(data.user.id, {
          app_metadata: { password_reset_required: true },
        });
      }

      const response = NextResponse.redirect(`${origin}${next}`);
      responseCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
