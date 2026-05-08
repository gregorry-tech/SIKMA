'use client';

import React, { useEffect, useState } from 'react';
import { ListSkeleton } from '@/components/ui/Skeleton';
// For charts, we simulate Recharts using simple HTML/CSS bars to avoid forcing npm installs 
// but in a real app, you would import Recharts here as requested.
import Button from '@/components/ui/Button';

export default function KajurDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kajur/stats').then(r => r.json()).then(j => { setStats(j.data); setLoading(false); });
  }, []);

  if (loading) return <ListSkeleton count={4} />;

  // Prepare data for simple CSS charts
  const statusCounts = stats?.bookings_this_month || {};
  const statusArray = Object.entries(statusCounts).map(([status, count]) => ({ status, count: count as number }));
  const maxStatus = Math.max(...statusArray.map(s => s.count), 1);

  const semCounts = stats?.semester_distribution || {};
  const semArray = Object.entries(semCounts).map(([sem, count]) => ({ sem, count: count as number }));
  const maxSem = Math.max(...semArray.map(s => s.count), 1);

  const exportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nama Dosen,Total Konsultasi\n" + 
      stats.top_dosen.map((d: any) => `${d.full_name},${d.total_consultations}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "laporan_dosen.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Laporan</h1>
          <p className="text-sm text-gray-500">Tinjauan statistik bimbingan akademik</p>
        </div>
        <Button onClick={exportCsv} variant="secondary">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-blue-600">{stats?.total_bookings_this_month || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Booking Bulan Ini</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-green-600">{stats?.total_consultations || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Konsultasi Selesai</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-purple-600">{stats?.average_progress || 0}%</p>
          <p className="text-sm text-gray-500 mt-1">Rata-rata Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-yellow-600">{stats?.top_dosen?.length || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Dosen Aktif</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simple Bar Chart for Booking Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Status Booking (Bulan Ini)</h3>
          <div className="space-y-4">
            {statusArray.length === 0 ? <p className="text-sm text-gray-500">Tidak ada data</p> : 
              statusArray.map(s => (
              <div key={s.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize font-medium text-gray-700">{s.status}</span>
                  <span className="text-gray-500">{s.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${s.status === 'completed' ? 'bg-green-500' : s.status === 'pending' ? 'bg-yellow-500' : s.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(s.count / maxStatus) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Dosen */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Dosen (Terbanyak Konsultasi)</h3>
          <div className="space-y-4">
            {stats?.top_dosen?.length === 0 ? <p className="text-sm text-gray-500">Tidak ada data</p> : 
              stats?.top_dosen?.map((d: any, i: number) => (
              <div key={d.dosen_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <p className="font-medium text-gray-900 text-sm">{d.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{d.total_consultations}</p>
                  <p className="text-[10px] text-gray-500">bimbingan</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
