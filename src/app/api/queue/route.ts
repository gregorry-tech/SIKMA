import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dosen_id = searchParams.get('dosen_id');

  if (!dosen_id) {
    return NextResponse.json({ error: 'dosen_id is required' }, { status: 400 });
  }

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        mahasiswa:profiles!bookings_mahasiswa_id_fkey(id, full_name, nim, semester, program_studi, avatar_url)
      `)
      .eq('dosen_id', dosen_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Add rank (queue position)
    const queue = bookings?.map((item, index) => ({
      ...item,
      rank: index + 1
    })) || [];

    return NextResponse.json({ data: queue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
