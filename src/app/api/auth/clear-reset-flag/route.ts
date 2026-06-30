import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { password_reset_required: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
