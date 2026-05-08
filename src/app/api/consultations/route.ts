import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBookingNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    
    let query = supabase
      .from('consultations')
      .select(`
        *,
        booking:bookings(
            *,
            mahasiswa:profiles!bookings_mahasiswa_id_fkey(id, full_name, nim, avatar_url),
            dosen:profiles!bookings_dosen_id_fkey(id, full_name, nidn, avatar_url)
        ),
        documents(*)
      `);

    if (profile?.role === 'mahasiswa') {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('mahasiswa_id', user.id);
      if (bookingsError) throw bookingsError;
      const bookingIds = (bookings || []).map((b: any) => b.id);
      // FIXED: If there are no booking IDs, avoid calling `.in` with empty array (Supabase will error).
      if (bookingIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
      query = query.in('booking_id', bookingIds);
    } else if (profile?.role === 'dosen') {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('dosen_id', user.id);
      if (bookingsError) throw bookingsError;
      const bookingIds = (bookings || []).map((b: any) => b.id);
      if (bookingIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
      query = query.in('booking_id', bookingIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { booking_id, notes, next_agenda } = body;

    if (!booking_id) return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'dosen') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Ensure booking exists and belongs to this dosen
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', booking_id).single();
    if (!booking || booking.dosen_id !== user.id) {
        return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });
    }

    // FIXED: Verify booking is approved before creating consultation
    if (booking.status !== 'approved') {
        return NextResponse.json({ error: 'Booking harus berstatus approved untuk membuat konsultasi' }, { status: 400 });
    }

    // Insert consultation
    const { data: consultation, error: insertError } = await supabase
      .from('consultations')
      .insert({
        booking_id,
        notes,
        next_agenda
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update booking status to completed
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking_id);

    // Send notification to mahasiswa
    await sendBookingNotification(supabase, booking, 'done');

    return NextResponse.json({ data: consultation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
