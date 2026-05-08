import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'mahasiswa') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Get bookings count
    const [
      { count: totalBookings },
      { count: pendingBookings },
      { count: completedBookings },
      { data: activeBookings }
    ] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('mahasiswa_id', user.id),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('mahasiswa_id', user.id).eq('status', 'pending'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('mahasiswa_id', user.id).eq('status', 'completed'),
      supabase.from('bookings').select('id').eq('mahasiswa_id', user.id)
    ]);

    // 2. Get average progress
    let avgProgress = 0;

    return NextResponse.json({
      data: {
        total: totalBookings || 0,
        pending: pendingBookings || 0,
        completed: completedBookings || 0,
        avgProgress
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
