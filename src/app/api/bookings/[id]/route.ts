import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBookingNotification } from '@/lib/notifications';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // FIXED: Require authentication to view booking details
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        mahasiswa:profiles!bookings_mahasiswa_id_fkey(id, full_name, nim, program_studi, semester, avatar_url),
        dosen:profiles!bookings_dosen_id_fkey(id, full_name, nidn, avatar_url),
        schedule:dosen_schedules(*),
        consultation:consultations(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // FIXED: Restrict access—only owner (mahasiswa/dosen), admin, or kajur can view
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isOwner = booking.mahasiswa_id === user.id || booking.dosen_id === user.id;
    const isPrivileged = profile?.role === 'admin' || profile?.role === 'kajur';
    if (!isOwner && !isPrivileged) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', params.id).single();

    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updates: any = {};

    if (profile?.role === 'mahasiswa') {
      if (booking.mahasiswa_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (body.status === 'cancelled') {
        if (booking.status !== 'pending') return NextResponse.json({ error: 'Cannot cancel non-pending booking' }, { status: 400 });
        updates.status = 'cancelled';
      }
    } else if (profile?.role === 'dosen') {
      if (booking.dosen_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      
      if (body.status) updates.status = body.status;
      if (body.rejection_reason) updates.rejection_reason = body.rejection_reason;
      if (body.manual_boost !== undefined) updates.manual_boost = body.manual_boost;
      if (body.status === 'approved') updates.approved_at = new Date().toISOString();
    } else if (profile?.role === 'admin' || profile?.role === 'kajur') {
       // admin/kajur overrides
       Object.assign(updates, body);
    }

    const { data: updatedBooking, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Send notifications based on status change
    if (updates.status === 'approved') {
        await sendBookingNotification(supabase, updatedBooking, 'approved');
    } else if (updates.status === 'rejected') {
        await sendBookingNotification(supabase, updatedBooking, 'rejected');
    }

    return NextResponse.json({ data: updatedBooking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // FIXED: Only mahasiswa (owner) can cancel pending bookings, or admin/kajur can force-delete
    const { data: booking } = await supabase.from('bookings').select('*').eq('id', params.id).single();
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'kajur';
    const isMahasiswa = profile?.role === 'mahasiswa' && booking.mahasiswa_id === user.id;

    if (isMahasiswa && booking.status !== 'pending') {
      return NextResponse.json({ error: 'Hanya booking pending yang dapat dibatalkan' }, { status: 400 });
    }

    if (!isMahasiswa && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase.from('bookings').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ data: { success: true } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
