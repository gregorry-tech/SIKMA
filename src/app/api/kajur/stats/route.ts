import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Check kajur or admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'kajur' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // 1. Total booking bulan ini (group by status)
    const { data: allBookingsThisMonth } = await supabase
      .from('bookings')
      .select('status')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth);

    const bookingsByStatus = (allBookingsThisMonth ?? []).reduce(
      (acc: Record<string, number>, b: any) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      },
      {}
    );

    // 2. Total konsultasi selesai (all-time)
    const { count: totalConsultations } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true });

    // 3. Rata-rata progress mahasiswa
    const avgProgress = 0;

    // 4. Top 5 dosen berdasarkan jumlah konsultasi
    const { data: dosenConsultations } = await supabase
      .from('bookings')
      .select('dosen_id, dosen:profiles!bookings_dosen_id_fkey(full_name)')
      .eq('status', 'completed');

    const dosenCountMap: Record<string, { full_name: string; count: number }> = {};
    (dosenConsultations ?? []).forEach((b: any) => {
      const id = b.dosen_id;
      if (!dosenCountMap[id]) {
        dosenCountMap[id] = { full_name: b.dosen?.full_name ?? 'Unknown', count: 0 };
      }
      dosenCountMap[id].count++;
    });

    const topDosen = Object.entries(dosenCountMap)
      .map(([id, val]) => ({ dosen_id: id, full_name: val.full_name, total_consultations: val.count }))
      .sort((a, b) => b.total_consultations - a.total_consultations)
      .slice(0, 5);

    // 5. Distribusi mahasiswa per semester
    const { data: mahasiswaData } = await supabase
      .from('profiles')
      .select('semester')
      .eq('role', 'mahasiswa')
      .not('semester', 'is', null);

    const semesterDistribution = (mahasiswaData ?? []).reduce(
      (acc: Record<number, number>, m: any) => {
        const s = m.semester as number;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      data: {
        bookings_this_month: bookingsByStatus,
        total_bookings_this_month: allBookingsThisMonth?.length ?? 0,
        total_consultations: totalConsultations ?? 0,
        average_progress: avgProgress,
        top_dosen: topDosen,
        semester_distribution: semesterDistribution,
      },
    });
  } catch (error: any) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
