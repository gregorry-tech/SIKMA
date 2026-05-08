import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendBookingNotification } from '@/lib/notifications';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'dosen') {
      return NextResponse.json({ error: 'Only dosen can approve bookings' }, { status: 403 });
    }

    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('dosen_id', user.id) // Ensure security
      .select()
      .single();

    if (updateError) throw updateError;

    await sendBookingNotification(supabase, booking, 'approved');

    return NextResponse.json({ data: booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
