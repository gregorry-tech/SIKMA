import { SupabaseClient } from '@supabase/supabase-js';
import { NotifType } from '@/types';

export async function sendNotification(
  supabase: SupabaseClient,
  userId: string,
  type: NotifType,
  title: string,
  body: string,
  relatedBookingId?: string
) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      related_booking_id: relatedBookingId || null,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function sendBookingNotification(
  supabase: SupabaseClient,
  booking: any,
  action: 'new' | 'approved' | 'rejected' | 'reminder' | 'done'
) {
  let type: NotifType;
  let title = '';
  let body = '';
  let targetUserId = '';

  switch (action) {
    case 'new':
      type = 'booking_new';
      title = 'Permintaan Bimbingan Baru';
      body = `Mahasiswa mengajukan jadwal bimbingan pada ${booking.date}. Topik: ${booking.topic}`;
      targetUserId = booking.dosen_id;
      break;
    case 'approved':
      type = 'booking_approved';
      title = 'Bimbingan Disetujui';
      body = `Pengajuan bimbingan Anda pada tanggal ${booking.date} telah disetujui oleh Dosen.`;
      targetUserId = booking.mahasiswa_id;
      break;
    case 'rejected':
      type = 'booking_rejected';
      title = 'Bimbingan Ditolak';
      body = `Pengajuan bimbingan Anda pada ${booking.date} ditolak. Alasan: ${booking.rejection_reason || 'Tidak ada alasan.'}`;
      targetUserId = booking.mahasiswa_id;
      break;
    case 'reminder':
      type = 'booking_reminder';
      title = 'Pengingat Bimbingan';
      body = `Anda memiliki jadwal bimbingan besok pada ${booking.date}.`;
      // Can be sent to both, but typically to mahasiswa or both
      targetUserId = booking.mahasiswa_id; 
      break;
    case 'done':
      type = 'consultation_done';
      title = 'Catatan Konsultasi Tersedia';
      body = `Dosen telah menambahkan catatan untuk bimbingan pada ${booking.date}. Silakan cek hasil bimbingan Anda.`;
      targetUserId = booking.mahasiswa_id;
      break;
  }

  return sendNotification(supabase, targetUserId, type, title, body, booking.id);
}
