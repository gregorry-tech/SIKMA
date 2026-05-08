import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'dosen') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [
      { data: uniqueStudents },
      { count: pendingCount },
      { count: completedMonthCount }
    ] = await Promise.all([
      // Get unique mahasiswa_ids by getting distinct via group or just pulling ids
      // Supabase JS doesn't have distinct yet without RPC, so we pull ids and unique them
      supabase.from('bookings').select('mahasiswa_id').eq('dosen_id', user.id),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('dosen_id', user.id).eq('status', 'pending'),
      supabase.from('bookings').select('*', { count: 'exact', head: true })
        .eq('dosen_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', firstDayOfMonth)
    ]);

    const totalMhs = new Set((uniqueStudents || []).map(b => b.mahasiswa_id)).size;

    return NextResponse.json({
      data: {
        totalMhs,
        pending: pendingCount || 0,
        completedMonth: completedMonthCount || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
