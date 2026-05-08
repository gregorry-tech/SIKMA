'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueue } from '@/hooks/useQueue';
import { ListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function DosenAntrianPage() {
  const { user } = useAuth();
  const { queue, loading, refetch } = useQueue(user?.id || null);
  const { showToast } = useToast();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}/approve`, { method: 'PATCH' });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast('Booking berhasil disetujui!', 'success');
      refetch();
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) { showToast('Alasan penolakan wajib diisi.', 'error'); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${rejectId}/reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rejection_reason: rejectReason }) });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast('Booking berhasil ditolak.', 'success');
      setRejectId(null); setRejectReason('');
      refetch();
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  if (loading) return <ListSkeleton count={4} />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Antrian Mahasiswa</h1>
      <p className="text-sm text-gray-500 mb-6">Antrian booking pending mahasiswa</p>

      {queue.length === 0 ? (
        <EmptyState title="Tidak Ada Antrian" description="Belum ada booking pending saat ini." />
      ) : (
        <div className="space-y-4">
          {queue.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex-shrink-0">
                  #{item.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar src={item.mahasiswa?.avatar_url} name={item.mahasiswa?.full_name} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900">{item.mahasiswa?.full_name}</p>
                      <p className="text-xs text-gray-500">NIM: {item.mahasiswa?.nim} · Semester {item.mahasiswa?.semester} · {item.mahasiswa?.program_studi}</p>
                    </div>
                  </div>
                  <h4 className="font-medium text-sm text-gray-800 mb-1">{item.topic}</h4>
                  {item.description && <p className="text-xs text-gray-500 mb-2">{item.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                    <span>📅 {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>⏳ Menunggu {daysSince(item.created_at)} hari</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(item.id)} loading={actionLoading}>Setujui</Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectId(item.id)}>Tolak</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!rejectId} onClose={() => { setRejectId(null); setRejectReason(''); }} title="Tolak Booking">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan *</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Berikan alasan..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setRejectId(null)}>Batal</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleReject}>Tolak Booking</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
