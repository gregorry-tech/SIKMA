'use client';

import React from 'react';

interface BookingStatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Menunggu', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  approved: { label: 'Disetujui', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  rejected: { label: 'Ditolak', classes: 'bg-red-100 text-red-800 border-red-200' },
  completed: { label: 'Selesai', classes: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Dibatalkan', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const s = statusMap[status] || statusMap.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.classes}`}>
      {s.label}
    </span>
  );
}
