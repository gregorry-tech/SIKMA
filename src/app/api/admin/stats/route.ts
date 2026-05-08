import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    const [
      { count: usersCount },
      { count: mahasiswaCount },
      { count: dosenCount },
      { count: adminCount },
      { count: bookingsCount },
      { count: pendingCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('date', today),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return NextResponse.json({
      data: {
        users: usersCount || 0,
        mahasiswa: mahasiswaCount || 0,
        dosen: dosenCount || 0,
        admin: adminCount || 0,
        bookings: bookingsCount || 0,
        pending: pendingCount || 0
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
