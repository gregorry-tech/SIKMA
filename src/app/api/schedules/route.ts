import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  
  const { searchParams } = new URL(request.url);
  const dosen_id = searchParams.get('dosen_id');
  const date = searchParams.get('date');

  if (!dosen_id) {
    return NextResponse.json({ error: 'dosen_id is required' }, { status: 400 });
  }

  try {
    const { data: schedules, error } = await supabase
      .from('dosen_schedules')
      .select('*')
      .eq('dosen_id', dosen_id)
      .eq('is_active', true);

    if (error) throw error;

    if (date && schedules) {
      // Calculate available slots if date is provided
      const { data: approvedBookings } = await supabase
        .from('bookings')
        .select('schedule_id')
        .eq('dosen_id', dosen_id)
        .eq('date', date)
        .eq('status', 'approved');

      const bookingCounts = approvedBookings?.reduce((acc: any, curr: any) => {
        if (curr.schedule_id) {
          acc[curr.schedule_id] = (acc[curr.schedule_id] || 0) + 1;
        }
        return acc;
      }, {});

      const schedulesWithSlots = schedules.map(schedule => {
        const used = bookingCounts?.[schedule.id] || 0;
        return {
          ...schedule,
          available_slots: Math.max(0, schedule.max_slots - used)
        };
      });

      return NextResponse.json({ data: schedulesWithSlots });
    }

    return NextResponse.json({ data: schedules });
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
    
    // Only dosen can create schedules
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'dosen') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // FIXED: Validate input fields
    const { day_of_week, start_time, end_time, duration_minutes, max_slots } = body;
    
    if (day_of_week === undefined || day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({ error: 'day_of_week harus antara 0-6' }, { status: 400 });
    }
    if (!start_time || !end_time) {
      return NextResponse.json({ error: 'start_time dan end_time wajib' }, { status: 400 });
    }
    if (duration_minutes && duration_minutes <= 0) {
      return NextResponse.json({ error: 'duration_minutes harus positif' }, { status: 400 });
    }
    if (!max_slots || max_slots <= 0) {
      return NextResponse.json({ error: 'max_slots harus positif' }, { status: 400 });
    }

    const { data: schedule, error } = await supabase
      .from('dosen_schedules')
      .insert({
        ...body,
        dosen_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data: schedule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
