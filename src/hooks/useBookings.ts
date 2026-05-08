'use client';

import { useState, useCallback } from 'react';
import { Booking } from '@/types';

interface UseBookingsOptions {
  status?: string;
  page?: number;
  limit?: number;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchBookings = useCallback(async (overrides?: UseBookingsOptions) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const status = overrides?.status || options.status;
      const page = overrides?.page || options.page || 1;
      const limit = overrides?.limit || options.limit || 10;

      if (status) params.set('status', status);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/bookings?${params}`);
      const json = await res.json();
      setBookings(json.data || []);
      setTotal(json.meta?.total || 0);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.page, options.limit]);

  return { bookings, loading, total, fetchBookings, setBookings };
}
