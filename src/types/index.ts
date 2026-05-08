export type UserRole = 'mahasiswa' | 'dosen' | 'admin' | 'kajur';
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
export type NotifType = 'booking_new' | 'booking_approved' | 'booking_rejected' | 'booking_reminder' | 'consultation_done';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  nim: string | null;
  nidn: string | null;
  semester: number | null;
  program_studi: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  max_students_per_day: number;
  created_at: string;
  updated_at: string;
}

export interface DosenSchedule {
  id: string;
  dosen_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_slots: number;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  dosen?: Profile;
}

export interface Booking {
  id: string;
  mahasiswa_id: string;
  dosen_id: string;
  schedule_id: string | null;
  date: string;
  topic: string;
  description: string | null;
  status: BookingStatus;
  priority_score: number;
  manual_boost: number;
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  mahasiswa?: Profile;
  dosen?: Profile;
  schedule?: DosenSchedule;
  consultation?: Consultation;
}

export interface Consultation {
  id: string;
  booking_id: string;
  notes: string | null;
  next_agenda: string | null;
  dosen_rating: number | null;
  is_signed: boolean;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  consultation_id: string | null;
  booking_id: string | null;
  uploader_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  description: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string | null;
  is_read: boolean;
  related_booking_id: string | null;
  created_at: string;
}
