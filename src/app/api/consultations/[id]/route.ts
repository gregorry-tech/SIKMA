import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: consultation, error } = await supabase
      .from('consultations')
      .select(`
        *,
        booking:bookings(
            *,
            mahasiswa:profiles!bookings_mahasiswa_id_fkey(*),
            dosen:profiles!bookings_dosen_id_fkey(*)
        ),
        documents(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!consultation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data: consultation });
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
    
    // Only dosen can update consultation details
    if (profile?.role !== 'dosen') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // FIXED: Verify consultation belongs to this dosen's booking
    const { data: consultation } = await supabase
      .from('consultations')
      .select('booking_id')
      .eq('id', params.id)
      .single();
    
    if (!consultation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: booking } = await supabase
      .from('bookings')
      .select('dosen_id')
      .eq('id', consultation.booking_id)
      .single();
    
    if (!booking || booking.dosen_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updatedConsultation, error } = await supabase
      .from('consultations')
      .update(body) // notes, next_agenda, etc
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: updatedConsultation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
