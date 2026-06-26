import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized.' } },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('[delete-account] Admin delete failed:', deleteError.message);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete account.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
