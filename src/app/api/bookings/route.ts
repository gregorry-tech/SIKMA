import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBookingNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    
    let query = supabase
      .from('bookings')
      .select(`
        *,
        mahasiswa:profiles!bookings_mahasiswa_id_fkey(id, full_name, nim, program_studi, semester, avatar_url),
        dosen:profiles!bookings_dosen_id_fkey(id, full_name, nidn, avatar_url),
        schedule:dosen_schedules(*)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (profile?.role === 'mahasiswa') {
      query = query.eq('mahasiswa_id', user.id);
    } else if (profile?.role === 'dosen') {
      query = query.eq('dosen_id', user.id);
    }
    // Admin/Kajur gets all

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ 
      data,
      meta: { total: count, page, limit }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dosen_id, schedule_id, date, topic, description } = body;

    if (!dosen_id || !schedule_id || !date || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify role is mahasiswa
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'mahasiswa') {
      return NextResponse.json({ error: 'Only mahasiswa can create bookings' }, { status: 403 });
    }

    const { data: schedule, error: scheduleError } = await supabase
      .from('dosen_schedules')
      .select('id, dosen_id, max_slots, is_active')
      .eq('id', schedule_id)
      .single();

    if (scheduleError || !schedule || !schedule.is_active) {
      return NextResponse.json({ error: 'Jadwal tidak valid atau sudah tidak aktif' }, { status: 400 });
    }

    if (schedule.dosen_id !== dosen_id) {
      return NextResponse.json({ error: 'Jadwal tidak sesuai dengan dosen yang dipilih' }, { status: 400 });
    }

    const { count: approvedCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('schedule_id', schedule_id)
      .eq('date', date)
      .eq('status', 'approved');

    if (approvedCount !== null && approvedCount >= schedule.max_slots) {
      return NextResponse.json({ error: 'Slot pada tanggal ini sudah penuh. Silakan pilih tanggal lain.' }, { status: 400 });
    }

    // Validate: mahasiswa tidak boleh punya 2 booking pending ke dosen yang sama
    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('mahasiswa_id', user.id)
      .eq('dosen_id', dosen_id)
      .eq('status', 'pending');

    // FIXED: ensure we correctly check zero vs null
    if (pendingCount !== null && pendingCount > 0) {
      return NextResponse.json({ error: 'Anda sudah memiliki jadwal pending dengan dosen ini' }, { status: 400 });
    }

    // Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        mahasiswa_id: user.id,
        dosen_id,
        schedule_id,
        date,
        topic,
        description,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Send notification
    await sendBookingNotification(supabase, booking, 'new');

    return NextResponse.json({ data: booking }, { status: 201 });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
