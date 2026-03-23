import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/services/auth.service'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const user = await requireAuth(supabase)

    // Fetch profile details strictly tied to user ID
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      // Fallback to auth metadata if profile hasn't been synced via trigger yet
      return NextResponse.json({
        data: {
          id: user.id,
          username: user.user_metadata?.username,
          display_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url
        }
      })
    }

    return NextResponse.json({ data: profile })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
