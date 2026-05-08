'use client';

import React from 'react';
import Avatar from '@/components/ui/Avatar';
import BookingStatusBadge from './BookingStatusBadge';
import Button from '@/components/ui/Button';
import { Booking } from '@/types';

interface BookingCardProps {
  booking: Booking;
  role: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function BookingCard({ booking, role, onApprove, onReject, onCancel, onClick }: BookingCardProps) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(booking.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={role === 'mahasiswa' ? booking.dosen?.avatar_url : booking.mahasiswa?.avatar_url}
            name={role === 'mahasiswa' ? booking.dosen?.full_name : booking.mahasiswa?.full_name}
            size="md"
          />
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {role === 'mahasiswa' ? booking.dosen?.full_name : booking.mahasiswa?.full_name}
            </p>
            <p className="text-xs text-gray-500">
              {role === 'mahasiswa'
                ? booking.dosen?.nidn && `NIDN: ${booking.dosen.nidn}`
                : booking.mahasiswa?.nim && `NIM: ${booking.mahasiswa.nim} · Semester ${booking.mahasiswa?.semester}`}
            </p>
          </div>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="mb-3">
        <h4 className="font-medium text-gray-900 text-sm">{booking.topic}</h4>
        {booking.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{booking.description}</p>}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {formatDate(booking.date)}
        </span>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {role === 'dosen' && booking.status === 'pending' && (
          <>
            <Button size="sm" variant="primary" onClick={() => onApprove?.(booking.id)}>Setujui</Button>
            <Button size="sm" variant="danger" onClick={() => onReject?.(booking.id)}>Tolak</Button>
          </>
        )}
        {role === 'mahasiswa' && booking.status === 'pending' && (
          <Button size="sm" variant="ghost" onClick={() => onCancel?.(booking.id)}>Batalkan</Button>
        )}
      </div>
    </div>
  );
}
