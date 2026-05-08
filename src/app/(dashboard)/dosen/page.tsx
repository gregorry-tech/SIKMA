'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ListSkeleton } from '@/components/ui/Skeleton';
import BookingCard from '@/components/booking/BookingCard';

export default function DosenDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ totalMhs: 0, pending: 0, completedMonth: 0 });
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [statsRes, todayRes, pendRes] = await Promise.all([
          fetch('/api/dosen/stats'),
          fetch(`/api/bookings?status=approved&limit=10`), // Note: can filter locally by date
          fetch('/api/bookings?status=pending&limit=5'),
        ]);
        const statsJson = await statsRes.json();
        const todayJson = await todayRes.json();
        const pendJson = await pendRes.json();

        setStats(statsJson.data || { totalMhs: 0, pending: 0, completedMonth: 0 });
        
        const allApproved = todayJson.data || [];
        setTodayBookings(allApproved.filter((b: any) => b.date === today));
        setPendingBookings((pendJson.data || []).slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <ListSkeleton count={3} />;

  const cards = [
    { label: 'Total Mahasiswa', value: stats.totalMhs, color: 'from-blue-500 to-blue-600' },
    { label: 'Booking Pending', value: stats.pending, color: 'from-yellow-500 to-orange-500' },
    { label: 'Konsultasi Bulan Ini', value: stats.completedMonth, color: 'from-green-500 to-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Dosen</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Bimbingan Hari Ini</h2>
        {todayBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">Tidak ada jadwal bimbingan hari ini.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{todayBookings.map((b) => <BookingCard key={b.id} booking={b} role="dosen" />)}</div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Booking Pending Terbaru</h2>
        {pendingBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">Tidak ada booking pending.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{pendingBookings.map((b) => <BookingCard key={b.id} booking={b} role="dosen" />)}</div>
        )}
      </div>
    </div>
  );
}
