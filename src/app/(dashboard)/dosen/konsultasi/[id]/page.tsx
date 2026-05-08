'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';

export default function DetailKonsultasiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const isNew = id === 'new';
  
  const { showToast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [consultation, setConsultation] = useState<any>(null);
  const [form, setForm] = useState({ notes: '', next_agenda: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (isNew) {
          if (!bookingId) return;
          const res = await fetch(`/api/bookings/${bookingId}`);
          const json = await res.json();
          setBooking(json.data);
          // Pre-fill progress if previous consultation exists? For simplicity, default to 0.
        } else {
          const res = await fetch(`/api/consultations/${id}`);
          const json = await res.json();
          setConsultation(json.data);
          setBooking(json.data?.booking);
          setForm({
            notes: json.data?.notes || '',
            next_agenda: json.data?.next_agenda || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, isNew, bookingId]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (isNew) {
        const res = await fetch('/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: booking.id, ...form })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        showToast('Catatan bimbingan berhasil disimpan.', 'success');
        router.push('/dosen/konsultasi');
      } else {
        const res = await fetch(`/api/consultations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        showToast('Catatan berhasil diperbarui.', 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFile = async (docId: string) => {
    const res = await fetch(`/api/documents/${docId}/download`);
    const json = await res.json();
    if (json.data?.signed_url) window.open(json.data.signed_url, '_blank');
  };

  if (loading) return <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>;
  if (!booking) return <div>Data tidak ditemukan</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()}>← Kembali</Button>
        <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Catatan Bimbingan Baru' : 'Detail Bimbingan'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Catatan */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hasil Bimbingan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan & Masukan</label>
                <textarea 
                  value={form.notes} 
                  onChange={e => setForm({...form, notes: e.target.value})} 
                  rows={5} 
                  placeholder="Berikan masukan untuk mahasiswa..." 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agenda Selanjutnya</label>
                <textarea 
                  value={form.next_agenda} 
                  onChange={e => setForm({...form, next_agenda: e.target.value})} 
                  rows={3} 
                  placeholder="Target untuk bimbingan berikutnya..." 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button loading={submitting} onClick={handleSave}>
                  {isNew ? 'Tandai Selesai & Simpan' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Info & Dokumen */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Informasi Mahasiswa</h3>
             <div className="flex items-center gap-3 mb-4">
                <Avatar src={booking.mahasiswa?.avatar_url} name={booking.mahasiswa?.full_name} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">{booking.mahasiswa?.full_name}</p>
                  <p className="text-xs text-gray-500">NIM: {booking.mahasiswa?.nim}</p>
                </div>
             </div>
             <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Tanggal:</span> <span className="font-medium">{new Date(booking.date).toLocaleDateString('id-ID')}</span></p>
                <p><span className="text-gray-500">Topik:</span> <span className="font-medium">{booking.topic}</span></p>
             </div>
             {booking.description && (
               <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                 {booking.description}
               </div>
             )}
          </div>

          {!isNew && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Dokumen Terlampir</h3>
               {consultation?.documents?.length > 0 ? (
                 <ul className="space-y-2">
                   {consultation.documents.map((doc: any) => (
                     <li key={doc.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                       <span className="text-sm font-medium text-gray-800 break-words">{doc.file_name}</span>
                       <Button size="sm" variant="secondary" onClick={() => downloadFile(doc.id)} className="w-full">
                         Download
                       </Button>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-sm text-gray-500 text-center py-4">Tidak ada dokumen.</p>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
