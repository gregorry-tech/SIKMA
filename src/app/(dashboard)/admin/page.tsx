'use client';

import React, { useEffect, useState } from 'react';
import { ListSkeleton } from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, mahasiswa: 0, dosen: 0, admin: 0, bookings: 0, pending: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats').catch(() => ({ ok: false, json: async () => ({}) })),
          fetch('/api/admin/users?limit=10').catch(() => ({ ok: false, json: async () => ({}) }))
        ]);
        
        let sJson: any = {};
        let uJson: any = {};
        
        try {
          if (statsRes && typeof statsRes.json === 'function') {
             sJson = await statsRes.json();
          }
        } catch (e) {}

        try {
          if (usersRes && typeof usersRes.json === 'function') {
             uJson = await usersRes.json();
          }
        } catch (e) {}

        setStats(sJson.data || { users: 0, mahasiswa: 0, dosen: 0, admin: 0, bookings: 0, pending: 0 });
        setUsers(uJson.data || []);
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <ListSkeleton count={4} />;

  const statCards = [
    { label: 'Total Pengguna', value: stats.users, icon: '👥', color: 'from-blue-500 to-blue-600' },
    { label: 'Mahasiswa', value: stats.mahasiswa, icon: '👨‍🎓', color: 'from-purple-500 to-purple-600' },
    { label: 'Dosen', value: stats.dosen, icon: '👨‍🏫', color: 'from-indigo-500 to-indigo-600' },
    { label: 'Admin', value: stats.admin, icon: '⚙️', color: 'from-red-500 to-red-600' },
    { label: 'Booking Hari Ini', value: stats.bookings, icon: '📅', color: 'from-green-500 to-green-600' },
    { label: 'Pending', value: stats.pending, icon: '⏳', color: 'from-yellow-500 to-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Admin</h1>
        <p className="text-gray-500">Monitoring sistem dan pengguna</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-6 text-white shadow-lg`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{card.label}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Pengguna</h2>
          <p className="text-sm text-gray-400 mt-1">Data hanya dapat dilihat, tidak dapat diubah</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Avatar src={u.avatar_url} name={u.full_name} size="sm" />
                    <span className="font-medium text-gray-900">{u.full_name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      u.role === 'admin' ? 'bg-red-100 text-red-800' :
                      u.role === 'dosen' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'mahasiswa' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
