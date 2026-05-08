'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import BookingCard from '@/components/booking/BookingCard';
import { ListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function AntrianPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    const res = await fetch('/api/bookings?status=pending&limit=50');
    const json = await res.json();
    setBookings(json.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('mhs-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `mahasiswa_id=eq.${user.id}` }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, supabase]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${cancelId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      showToast('Booking berhasil dibatalkan.', 'success');
      fetchBookings();
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setCancelling(false); setCancelId(null); }
  };

  if (loading) return <ListSkeleton count={4} />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Antrian Saya</h1>
      <p className="text-sm text-gray-500 mb-6">Status semua booking bimbingan Anda</p>
      {bookings.length === 0 ? (
        <EmptyState title="Tidak ada antrian aktif" description="Semua booking Anda sudah selesai atau dibatalkan." actionLabel="Booking Sekarang" onAction={() => router.push('/mahasiswa/booking')} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{bookings.map((b) => <BookingCard key={b.id} booking={b} role="mahasiswa" onCancel={(id) => setCancelId(id)} />)}</div>
      )}
      <Modal isOpen={!!cancelId} onClose={() => setCancelId(null)} title="Batalkan Booking?" size="sm">
        <p className="text-sm text-gray-600 mb-4">Apakah Anda yakin ingin membatalkan booking ini?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setCancelId(null)}>Tidak</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>Ya, Batalkan</Button>
        </div>
      </Modal>
    </div>
  );
}
