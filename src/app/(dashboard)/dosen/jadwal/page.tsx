'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ day_of_week: 1, start_time: '08:00', end_time: '09:00', duration_minutes: 60, max_slots: 3, location: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchSchedules = async () => {
    if (!user) return;
    const res = await fetch(`/api/schedules?dosen_id=${user.id}`);
    const json = await res.json();
    setSchedules(json.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSchedules(); }, [user]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast('Jadwal berhasil ditambahkan!', 'success');
      setShowModal(false);
      fetchSchedules();
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <ListSkeleton count={3} />;

  // Group by day
  const grouped: Record<number, any[]> = {};
  schedules.forEach((s) => { if (!grouped[s.day_of_week]) grouped[s.day_of_week] = []; grouped[s.day_of_week].push(s); });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Saya</h1>
          <p className="text-sm text-gray-500">Kelola jadwal bimbingan Anda</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Tambah Jadwal</Button>
      </div>

      {schedules.length === 0 ? (
        <EmptyState title="Belum Ada Jadwal" description="Tambahkan jadwal bimbingan agar mahasiswa bisa booking." actionLabel="Tambah Jadwal" onAction={() => setShowModal(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((day) => (
            <div key={day} className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{DAYS[day]}</h3>
              {(grouped[day] || []).length === 0 ? (
                <p className="text-xs text-gray-400">Tidak ada jadwal</p>
              ) : (
                <div className="space-y-2">
                  {(grouped[day] || []).map((s: any) => (
                    <div key={s.id} className={`rounded-lg p-3 border text-sm ${s.is_active ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                      <p className="font-medium">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</p>
                      <p className="text-xs text-gray-500">{s.duration_minutes} menit · {s.max_slots} slot</p>
                      {s.location && <p className="text-xs text-gray-400">📍 {s.location}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Jadwal Baru">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
            <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: +e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white">
              {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label><input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Maks Slot</label><input type="number" value={form.max_slots} onChange={(e) => setForm({ ...form, max_slots: +e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label><input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Contoh: Ruang Dosen Lt. 3" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
            <Button loading={submitting} onClick={handleCreate}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
