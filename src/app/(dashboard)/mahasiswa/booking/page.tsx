'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function BookingPage() {
  const router = useRouter();
  // FIXED: Safe fallback if useToast is not available
  let showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  try {
    const toast = useToast();
    showToast = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => toast.showToast?.(msg, type);
  } catch (e) {
    // Fallback if no toast provider
    showToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => {
      alert(msg);
      console.error(msg);
    };
  }

  const [step, setStep] = useState(1);
  const [dosenList, setDosenList] = useState<any[]>([]);
  const [selectedDosen, setSelectedDosen] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  useEffect(() => {
    // FIXED: Add error handling for dosen list fetch
    fetch('/api/dosen')
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setDosenList(j.data);
        else setDosenList([]);
      })
      .catch((err) => {
        console.error('Error fetching dosen list:', err);
        showToast('Gagal memuat data dosen');
      })
      .finally(() => setLoading(false));
  }, []);

  const selectDosen = async (dosen: any) => {
    setSelectedDosen(dosen);
    setSelectedSchedule(null);
    setSelectedDate('');
    setTopic('');
    setDescription('');
    setStep(2);
    try {
      // FIXED: Add error handling for schedule fetch
      const res = await fetch(`/api/schedules?dosen_id=${dosen.id}`);
      if (!res.ok) throw new Error('Failed to fetch schedules');
      const json = await res.json();
      if (json.data) {
        setSchedules(json.data);
      } else {
        setSchedules([]);
      }
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      showToast('Gagal memuat jadwal dosen');
      setStep(1);
    }
  };

  const selectSchedule = (sched: any) => {
    setSelectedSchedule(sched);
    setSelectedDate('');
    setStep(3);
  };

  const selectDate = async (date: string) => {
    if (!selectedDosen || !selectedSchedule) return;

    const res = await fetch(`/api/schedules?dosen_id=${selectedDosen.id}&date=${date}`);
    const json = await res.json();
    const schedule = (json.data || []).find((item: any) => item.id === selectedSchedule.id);

    if (schedule && schedule.available_slots === 0) {
      showToast('Slot pada tanggal ini sudah penuh. Silakan pilih tanggal lain.');
      return;
    }

    setSelectedSchedule(schedule || selectedSchedule);
    setSelectedDate(date);
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!selectedDosen || !selectedSchedule || !selectedDate) {
      showToast('Silakan pilih dosen, jadwal, dan tanggal terlebih dahulu.');
      return;
    }
    if (!topic.trim()) { showToast('Topik wajib diisi.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dosen_id: selectedDosen.id, schedule_id: selectedSchedule.id, date: selectedDate, topic, description }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const qRes = await fetch(`/api/queue?dosen_id=${selectedDosen.id}`);
      const qJson = await qRes.json();
      const pos = (qJson.data || []).findIndex((q: any) => q.id === json.data.id);
      setQueuePosition(pos >= 0 ? pos + 1 : null);

      setStep(5);
      showToast('Booking berhasil dibuat!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate available dates for next 30 days based on selected schedule's day_of_week
  const getAvailableDates = () => {
    if (!selectedSchedule) return [];
    const dates: string[] = [];
    const today = new Date();
    
    const targetDay = Number(selectedSchedule.day_of_week);
    
    // Prevent Saturday (6) and Sunday (0) entirely per user request
    if (targetDay === 0 || targetDay === 6) return [];

    for (let i = 1; i <= 30; i++) {
      // Use local time construction to completely avoid UTC offset bugs
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const dayOfWeek = d.getDay();
      
      // Ensure it matches the requested day, and is strictly Monday-Friday
      if (dayOfWeek === targetDay && dayOfWeek >= 1 && dayOfWeek <= 5) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
      }
    }
    return dates;
  };

  if (loading) return <ListSkeleton count={4} />;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
            {s < 5 && <div className={`flex-1 h-1 rounded-full ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Pilih Dosen */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Dosen Pembimbing</h2>
          <p className="text-sm text-gray-500 mb-6">Pilih dosen yang ingin Anda booking untuk bimbingan</p>
          <div className="grid gap-4 md:grid-cols-2">
            {dosenList.map((d) => (
              <button key={d.id} onClick={() => selectDosen(d)} className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={d.avatar_url} name={d.full_name} size="lg" />
                  <div>
                    <p className="font-semibold text-gray-900">{d.full_name}</p>
                    <p className="text-xs text-gray-500">{d.nidn && `NIDN: ${d.nidn}`}</p>
                    <p className="text-xs text-blue-600">{d.program_studi}</p>
                  </div>
                </div>
                {d.bio && <p className="text-xs text-gray-500 line-clamp-2">{d.bio}</p>}
                <p className="text-xs text-gray-400 mt-2">{d.dosen_schedules?.length || 0} jadwal aktif</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Pilih Jadwal */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Jadwal</h2>
          <p className="text-sm text-gray-500 mb-6">Jadwal tersedia dari {selectedDosen?.full_name}</p>
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Dosen ini belum memiliki jadwal aktif.</p>
              <Button variant="ghost" className="mt-4" onClick={() => setStep(1)}>Kembali</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {schedules.map((s: any) => (
                <button key={s.id} onClick={() => selectSchedule(s)} className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-blue-200 transition-all flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{DAY_NAMES[s.day_of_week]}</p>
                    <p className="text-sm text-gray-500">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)} · {s.duration_minutes} menit</p>
                    {s.location && <p className="text-xs text-gray-400 mt-1">📍 {s.location}</p>}
                  </div>
                  <span className="text-xs text-blue-600 font-medium">{s.available_slots !== undefined ? `${s.available_slots} slot` : `${s.max_slots} slot`}</span>
                </button>
              ))}
            </div>
          )}
          <Button variant="ghost" className="mt-4" onClick={() => setStep(1)}>← Kembali</Button>
        </div>
      )}

      {/* Step 3: Pilih Tanggal */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Tanggal</h2>
          <p className="text-sm text-gray-500 mb-6">Tanggal yang tersedia (30 hari ke depan)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {getAvailableDates().map((date) => (
              <button key={date} onClick={() => selectDate(date)} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-blue-200 transition-all">
                <p className="font-semibold text-gray-900">{new Date(date + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                <p className="text-sm text-gray-500">{new Date(date + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </button>
            ))}
          </div>
          <Button variant="ghost" className="mt-4" onClick={() => setStep(2)}>← Kembali</Button>
        </div>
      )}

      {/* Step 4: Isi Detail */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Detail Bimbingan</h2>
          <p className="text-sm text-gray-500 mb-6">Jelaskan topik bimbingan yang ingin dibahas</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topik Bimbingan *</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Contoh: Revisi BAB 3 Metodologi" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Jelaskan detail yang ingin dibahas..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" />
            </div>

            {/* Summary */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Ringkasan Booking</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>👨‍🏫 Dosen: <strong>{selectedDosen?.full_name}</strong></p>
                <p>📅 Tanggal: <strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                <p>⏰ Waktu: <strong>{selectedSchedule?.start_time?.slice(0, 5)} – {selectedSchedule?.end_time?.slice(0, 5)}</strong></p>
                {selectedSchedule?.location && <p>📍 Lokasi: <strong>{selectedSchedule.location}</strong></p>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(3)}>← Kembali</Button>
              <Button onClick={handleSubmit} loading={submitting} className="flex-1">Kirim Booking</Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Berhasil!</h3>
          <p className="text-sm text-gray-500 mb-2">Permintaan bimbingan Anda telah dikirim ke {selectedDosen?.full_name}.</p>
          {queuePosition && (
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-6">
              Posisi antrian Anda: <span className="font-bold text-lg">#{queuePosition}</span>
            </div>
          )}
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="secondary" onClick={() => router.push('/mahasiswa/antrian')}>Lihat Antrian</Button>
            <Button onClick={() => router.push('/mahasiswa')}>Ke Dashboard</Button>
          </div>
        </div>
      )}
    </div>
  );
}
