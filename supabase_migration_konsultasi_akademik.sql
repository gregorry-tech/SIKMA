-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('mahasiswa', 'dosen', 'admin', 'kajur');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.notif_type AS ENUM ('booking_new', 'booking_approved', 'booking_rejected', 'booking_reminder', 'consultation_done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. TABEL (beserta constraint & foreign key)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role public.user_role DEFAULT 'mahasiswa',
    nim TEXT,
    nidn TEXT,
    semester INT,
    program_studi TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    max_students_per_day INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dosen_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dosen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    max_slots INT DEFAULT 3,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mahasiswa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    dosen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    schedule_id UUID REFERENCES public.dosen_schedules(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    status public.booking_status DEFAULT 'pending',
    priority_score FLOAT DEFAULT 0,
    manual_boost FLOAT DEFAULT 0,
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
    notes TEXT,
    next_agenda TEXT,
    progress_percentage INT CHECK (progress_percentage BETWEEN 0 AND 100),
    dosen_rating INT CHECK (dosen_rating BETWEEN 1 AND 5),
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type public.notif_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    is_read BOOLEAN DEFAULT false,
    related_booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. INDEXES PERFORMA
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_dosen_status_priority ON public.bookings(dosen_id, status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_mahasiswa_created ON public.bookings(mahasiswa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_date_dosen ON public.bookings(date, dosen_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dosen_schedules_dosen_active ON public.dosen_schedules(dosen_id, is_active);

-- ==============================================================================
-- 4. POSTGRESQL FUNCTIONS
-- ==============================================================================

-- a) calculate_priority_score
CREATE OR REPLACE FUNCTION public.calculate_priority_score(semester INT, created_at TIMESTAMPTZ, manual_boost FLOAT)
RETURNS FLOAT AS $$
DECLARE
    semester_weight FLOAT;
    hari_tunggu FLOAT;
BEGIN
    -- Hitung weight semester
    IF semester >= 8 THEN
        semester_weight := 5.0;
    ELSIF semester = 7 THEN
        semester_weight := 4.0;
    ELSIF semester = 6 THEN
        semester_weight := 3.0;
    ELSIF semester = 5 THEN
        semester_weight := 2.5;
    ELSIF semester = 4 THEN
        semester_weight := 2.0;
    ELSE
        semester_weight := 1.0;
    END IF;

    -- Hitung hari tunggu (minimal 0)
    hari_tunggu := EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0;
    IF hari_tunggu < 0 THEN
        hari_tunggu := 0;
    END IF;

    RETURN (semester_weight * 10) + (hari_tunggu * 0.5) + COALESCE(manual_boost, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- b) handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- c) set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- d) trigger_update_priority
CREATE OR REPLACE FUNCTION public.trigger_update_priority()
RETURNS TRIGGER AS $$
DECLARE
    m_semester INT;
BEGIN
    SELECT semester INTO m_semester FROM public.profiles WHERE id = NEW.mahasiswa_id;
    
    NEW.priority_score := public.calculate_priority_score(
        COALESCE(m_semester, 1), 
        COALESCE(NEW.created_at, NOW()), 
        NEW.manual_boost
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- e) auth_user_role
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role AS $$
DECLARE
    u_role public.user_role;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. TRIGGERS
-- ==============================================================================

-- a) on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- b) bookings_priority_trigger
DROP TRIGGER IF EXISTS bookings_priority_trigger ON public.bookings;
CREATE TRIGGER bookings_priority_trigger
    BEFORE INSERT OR UPDATE OF manual_boost ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_priority();

-- c) updated_at triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_dosen_schedules_updated_at ON public.dosen_schedules;
CREATE TRIGGER set_dosen_schedules_updated_at 
    BEFORE UPDATE ON public.dosen_schedules 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_consultations_updated_at ON public.consultations;
CREATE TRIGGER set_consultations_updated_at 
    BEFORE UPDATE ON public.consultations 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosen_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- PROFILES POLICIES
-- -------------------------
-- User lihat profil sendiri
CREATE POLICY "User dapat melihat profil sendiri" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
-- Semua user bisa lihat profil dosen (untuk keperluan booking)
CREATE POLICY "User dapat melihat profil dosen" ON public.profiles FOR SELECT TO authenticated USING (role = 'dosen');
-- Admin/kajur lihat semua
CREATE POLICY "Admin dan kajur lihat semua profil" ON public.profiles FOR SELECT TO authenticated USING (public.auth_user_role() IN ('admin', 'kajur'));
-- User update profil sendiri
CREATE POLICY "User update profil sendiri" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- -------------------------
-- DOSEN_SCHEDULES POLICIES
-- -------------------------
-- Semua bisa lihat jadwal aktif
CREATE POLICY "Semua user melihat jadwal aktif" ON public.dosen_schedules FOR SELECT TO authenticated USING (is_active = true);
-- Dosen kelola jadwal sendiri
CREATE POLICY "Dosen kelola jadwal sendiri" ON public.dosen_schedules FOR ALL TO authenticated USING (dosen_id = auth.uid()) WITH CHECK (dosen_id = auth.uid());
-- Admin kelola semua
CREATE POLICY "Admin kelola jadwal" ON public.dosen_schedules FOR ALL TO authenticated USING (public.auth_user_role() = 'admin');

-- -------------------------
-- BOOKINGS POLICIES
-- -------------------------
-- Mahasiswa lihat booking sendiri
CREATE POLICY "Mahasiswa lihat booking sendiri" ON public.bookings FOR SELECT TO authenticated USING (mahasiswa_id = auth.uid());
-- Mahasiswa buat booking (hanya role mahasiswa)
CREATE POLICY "Mahasiswa buat booking" ON public.bookings FOR INSERT TO authenticated WITH CHECK (mahasiswa_id = auth.uid() AND public.auth_user_role() = 'mahasiswa');
-- Mahasiswa bisa cancel booking pending sendiri
CREATE POLICY "Mahasiswa cancel booking sendiri" ON public.bookings FOR UPDATE TO authenticated USING (mahasiswa_id = auth.uid() AND status = 'pending') WITH CHECK (status = 'cancelled');
-- Dosen lihat booking yang ditujukan ke mereka
CREATE POLICY "Dosen lihat booking ke mereka" ON public.bookings FOR SELECT TO authenticated USING (dosen_id = auth.uid());
-- Dosen bisa approve/reject/set manual_boost
CREATE POLICY "Dosen update booking mereka" ON public.bookings FOR UPDATE TO authenticated USING (dosen_id = auth.uid());
-- Admin & kajur lihat dan kelola semua
CREATE POLICY "Admin dan kajur kelola booking" ON public.bookings FOR ALL TO authenticated USING (public.auth_user_role() IN ('admin', 'kajur'));

-- -------------------------
-- CONSULTATIONS POLICIES
-- -------------------------
-- Mahasiswa lihat konsultasi dari booking mereka
CREATE POLICY "Mahasiswa lihat konsultasi sendiri" ON public.consultations FOR SELECT TO authenticated USING (
    booking_id IN (SELECT id FROM public.bookings WHERE mahasiswa_id = auth.uid())
);
-- Dosen kelola konsultasi dari booking mereka
CREATE POLICY "Dosen kelola konsultasi" ON public.consultations FOR ALL TO authenticated USING (
    booking_id IN (SELECT id FROM public.bookings WHERE dosen_id = auth.uid())
);
-- Admin & kajur lihat semua
CREATE POLICY "Admin dan kajur lihat konsultasi" ON public.consultations FOR SELECT TO authenticated USING (public.auth_user_role() IN ('admin', 'kajur'));
CREATE POLICY "Admin kelola konsultasi" ON public.consultations FOR ALL TO authenticated USING (public.auth_user_role() = 'admin');

-- -------------------------
-- DOCUMENTS POLICIES
-- -------------------------
-- Uploader lihat dokumen sendiri
CREATE POLICY "Uploader lihat dokumen sendiri" ON public.documents FOR SELECT TO authenticated USING (uploader_id = auth.uid());
-- Dosen lihat dokumen mahasiswa bimbingan mereka
CREATE POLICY "Dosen lihat dokumen bimbingan" ON public.documents FOR SELECT TO authenticated USING (
    consultation_id IN (
        SELECT c.id FROM public.consultations c
        JOIN public.bookings b ON c.booking_id = b.id
        WHERE b.dosen_id = auth.uid()
    ) OR 
    booking_id IN (
        SELECT id FROM public.bookings WHERE dosen_id = auth.uid()
    )
);
-- User login bisa upload
CREATE POLICY "User upload dokumen" ON public.documents FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());
-- Admin & kajur lihat dokumen
CREATE POLICY "Admin dan kajur lihat dokumen" ON public.documents FOR SELECT TO authenticated USING (public.auth_user_role() IN ('admin', 'kajur'));

-- -------------------------
-- NOTIFICATIONS POLICIES
-- -------------------------
-- User hanya akses notifikasi sendiri
CREATE POLICY "User akses notifikasi sendiri" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 7. SUPABASE STORAGE
-- ==============================================================================

-- Buat bucket 'skripsi-docs'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'skripsi-docs', 
    'skripsi-docs', 
    false, 
    52428800, -- 50MB 
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: upload hanya oleh pemilik folder (path: {user_id}/{consultation_id}/{filename})
CREATE POLICY "Allow users to upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'skripsi-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: akses file oleh pemilik atau dosen/admin/kajur
CREATE POLICY "Allow read access to documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'skripsi-docs' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text OR
        public.auth_user_role() IN ('dosen', 'admin', 'kajur')
    )
);

-- Policy: delete hanya oleh pemilik
CREATE POLICY "Allow delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'skripsi-docs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
