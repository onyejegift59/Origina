import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAllUserArtifacts } from '@/lib/supabase/queries';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const artifacts = await getAllUserArtifacts(authData.user.id);
  return NextResponse.json({ success: true, data: artifacts });
}
