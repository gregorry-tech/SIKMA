'use client';

import React, { useEffect, useState } from 'react';
import { ListSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';

export default function HistoriPage() {
  const { showToast } = useToast();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchConsultations = async () => {
    setLoading(true);
    const res = await fetch('/api/consultations');
    const json = await res.json();
    setConsultations(json.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  if (loading) return <ListSkeleton count={3} />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Histori Bimbingan</h1>
      <p className="text-sm text-gray-500 mb-6">Riwayat konsultasi dan catatan bimbingan Anda</p>

      {consultations.length === 0 ? (
        <EmptyState title="Belum Ada Histori" description="Anda belum memiliki catatan bimbingan." />
      ) : (
        <div className="space-y-4">
          {consultations.map((c: any) => {
            const expanded = expandedId === c.id;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button onClick={() => setExpandedId(expanded ? null : c.id)} className="w-full p-5 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar src={c.booking?.dosen?.avatar_url} name={c.booking?.dosen?.full_name} size="sm" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{c.booking?.dosen?.full_name}</p>
                        <p className="text-xs text-gray-500">{new Date(c.booking?.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{c.booking?.topic}</p>
                </button>

                {expanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
                    {c.notes && <div><p className="text-xs font-medium text-gray-500 mb-1">Catatan Dosen</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{c.notes}</p></div>}
                    {c.next_agenda && <div><p className="text-xs font-medium text-gray-500 mb-1">Agenda Selanjutnya</p><p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3">{c.next_agenda}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
