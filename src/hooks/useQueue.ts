'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useQueue(dosenId: string | null) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchQueue = useCallback(async () => {
    if (!dosenId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/queue?dosen_id=${dosenId}`);
      const json = await res.json();
      setQueue(json.data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  }, [dosenId]);

  useEffect(() => {
    fetchQueue();
    if (!dosenId) return;

    const channel = supabase
      .channel('queue-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `dosen_id=eq.${dosenId}` }, () => {
        fetchQueue();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dosenId, supabase, fetchQueue]);

  return { queue, loading, refetch: fetchQueue };
}
