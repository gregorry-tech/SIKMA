import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  // FIXED: Allow public access to list dosen (no auth required for browsing)

  try {
    // List all dosen profiles with their active schedules
    const { data: dosenList, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        nidn,
        program_studi,
        avatar_url,
        bio,
        max_students_per_day,
        dosen_schedules!dosen_schedules_dosen_id_fkey(
          id,
          day_of_week,
          start_time,
          end_time,
          duration_minutes,
          max_slots,
          location,
          is_active
        )
      `)
      .eq('role', 'dosen')
      .eq('dosen_schedules.is_active', true);

    if (error) throw error;

    return NextResponse.json({ data: dosenList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
