'use client';

import React, { useEffect, useState } from 'react';
import { ListSkeleton } from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/admin/users?role=${filter}` : '/api/admin/users';
      const res = await fetch(url);
      const json = await res.json();
      setUsers(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  if (loading) return <ListSkeleton count={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Pengguna</h1>
          <p className="text-sm text-gray-500">Tampilan monitoring semua akun di sistem</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
        >
          <option value="">Semua Role</option>
          <option value="mahasiswa">Mahasiswa</option>
          <option value="dosen">Dosen</option>
          <option value="admin">Admin</option>
          <option value="kajur">Kajur</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Profil</th>
                <th className="px-6 py-4">Identitas (NIM/NIDN)</th>
                <th className="px-6 py-4">Program Studi</th>
                <th className="px-6 py-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} name={u.full_name} size="md" />
                      <div>
                        <p className="font-semibold text-gray-900">{u.full_name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{u.nim || u.nidn || '-'}</p>
                    {u.semester && <p className="text-xs text-gray-500">Semester {u.semester}</p>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {u.program_studi || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      u.role === 'admin' ? 'bg-red-100 text-red-800' :
                      u.role === 'dosen' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'mahasiswa' ? 'bg-blue-100 text-blue-800' :
                      u.role === 'kajur' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
