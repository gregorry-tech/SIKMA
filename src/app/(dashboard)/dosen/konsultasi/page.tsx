'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';

export default function DaftarKonsultasiPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'mendatang' | 'selesai'>('mendatang');
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsultations = async () => {
      setLoading(true);
      try {
        // Fetch all bookings for this dosen to filter
        const res = await fetch(`/api/consultations`);
        const json = await res.json();
        setConsultations(json.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, []);

  if (loading) return <ListSkeleton count={4} />;

  // Note: /api/consultations returns the consultations. But for 'mendatang', we actually need 'approved' bookings.
  // Wait, the API only returns consultations, which are created AFTER a booking is completed.
  // To get 'mendatang' (approved bookings), we need to fetch from bookings. Let's fix this by fetching bookings.
  
  return (
    <ConsultationView />
  );
}

// Sub-component to handle both fetch logic
function ConsultationView() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'mendatang' | 'selesai'>('mendatang');
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [bookingsRes, consultsRes] = await Promise.all([
          fetch(`/api/bookings?status=approved&limit=100`),
          fetch(`/api/consultations`)
        ]);
        const bJson = await bookingsRes.json();
        const cJson = await consultsRes.json();
        
        // Filter bookings belonging to this dosen
        const dosenBookings = (bJson.data || []).filter((b: any) => b.dosen_id === user.id);
        const dosenConsults = (cJson.data || []).filter((c: any) => c.booking?.dosen_id === user.id);
        
        setUpcoming(dosenBookings);
        setCompleted(dosenConsults);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <ListSkeleton count={3} />;

  const activeData = tab === 'mendatang' ? upcoming : completed;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Daftar Konsultasi</h1>
      <p className="text-sm text-gray-500 mb-6">Kelola jadwal mendatang dan riwayat bimbingan</p>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('mendatang')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === 'mendatang' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Mendatang ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('selesai')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === 'selesai' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Selesai ({completed.length})
        </button>
      </div>

      {activeData.length === 0 ? (
        <EmptyState title="Tidak Ada Data" description={tab === 'mendatang' ? 'Tidak ada jadwal bimbingan mendatang.' : 'Belum ada riwayat konsultasi.'} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activeData.map((item: any) => {
            const isCompleted = tab === 'selesai';
            const mhs = isCompleted ? item.booking?.mahasiswa : item.mahasiswa;
            const date = isCompleted ? item.booking?.date : item.date;
            const topic = isCompleted ? item.booking?.topic : item.topic;
            
            return (
              <div 
                key={item.id} 
                className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => isCompleted ? router.push(`/dosen/konsultasi/${item.id}`) : router.push(`/dosen/konsultasi/new?booking_id=${item.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-3">
                      <Avatar src={mhs?.avatar_url} name={mhs?.full_name} size="md" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{mhs?.full_name}</p>
                        <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                   </div>
                </div>
                <h4 className="font-medium text-sm text-gray-800">{topic}</h4>
                {!isCompleted && (
                  <p className="text-xs text-blue-600 font-medium mt-3">Tulis Catatan →</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
