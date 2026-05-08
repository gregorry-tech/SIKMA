'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ListSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import BookingCard from '@/components/booking/BookingCard';

export default function MahasiswaDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, avgProgress: 0 });
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, upcomingRes, notifsRes] = await Promise.all([
          fetch('/api/mahasiswa/stats'),
          fetch('/api/bookings?status=approved&limit=3'),
          fetch('/api/notifications')
        ]);
        const statsJson = await statsRes.json();
        const upcomingJson = await upcomingRes.json();
        const notifsJson = await notifsRes.json();

        setStats(statsJson.data || { total: 0, pending: 0, completed: 0, avgProgress: 0 });
        
        // Filter upcoming on client side to ensure dates are >= today
        const today = new Date().toISOString().split('T')[0];
        const allUpcoming = upcomingJson.data || [];
        setUpcoming(allUpcoming.filter((b: any) => b.date >= today).slice(0, 3));
        
        setNotifications((notifsJson.data || []).slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <ListSkeleton count={3} />;

  const statCards = [
    { label: 'Total Booking', value: stats.total, color: 'from-blue-500 to-blue-600', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Menunggu', value: stats.pending, color: 'from-yellow-500 to-orange-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Selesai', value: stats.completed, color: 'from-green-500 to-emerald-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Progress', value: `${stats.avgProgress}%`, color: 'from-purple-500 to-indigo-600', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat Datang, {profile?.full_name?.split(' ')[0]}!</h1>
          <p className="text-sm text-gray-500 mt-1">Semester {profile?.semester} · {profile?.program_studi}</p>
        </div>
        <Button onClick={() => router.push('/mahasiswa/booking')}>+ Booking Bimbingan</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="relative overflow-hidden bg-white rounded-xl border border-gray-100 p-5">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} opacity-10 rounded-bl-full`} />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Bimbingan Mendatang</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500">Belum ada jadwal bimbingan mendatang.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((b) => <BookingCard key={b.id} booking={b} role="mahasiswa" />)}
          </div>
        )}
      </div>

      {/* Recent notifications */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Notifikasi Terbaru</h2>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Belum ada notifikasi.</p>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className={`px-5 py-3 ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
