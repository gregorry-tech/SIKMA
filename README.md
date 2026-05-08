# SIKMA - Sistem Informasi Konsultasi Mahasiswa Akademik

Platform manajemen konsultasi akademik antara mahasiswa dan dosen berbasis web dengan Next.js, Supabase, dan Tailwind CSS.

## Fitur Utama

- 🎓 **Manajemen Booking Konsultasi** - Mahasiswa dapat booking sesi konsultasi dengan dosen
- 📋 **Antrian Mahasiswa** - Dosen dapat melihat antrian booking yang masuk
- 📝 **Catatan Bimbingan** - Dokumentasi hasil konsultasi dan agenda berikutnya
- 📊 **Dashboard & Statistik** - Monitoring data konsultasi untuk admin dan kajur
- 🔔 **Notifikasi Real-time** - Informasi update booking dan konsultasi
- 👥 **Multi-role System** - Admin, Dosen, Mahasiswa, dan Kajur dengan akses berbeda

## Tech Stack

- **Frontend**: Next.js 15+, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Deployment**: Vercel
- **Authentication**: Supabase Auth

## Syarat Sistem

- Node.js 18+ atau 20+
- npm 10+ atau yarn
- Akun Supabase (https://supabase.com)
- Akun Vercel (https://vercel.com) - untuk deployment

## Setup Lokal

### 1. Clone Repository

```bash
git clone https://github.com/gregorry-tech/SIKMA.git
cd SIKMA
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy `.env.local.example` menjadi `.env.local` dan isi dengan kredensial Supabase Anda:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_CREATE_SECRET=your-secret-key
```

### 4. Setup Database

1. Buat project baru di Supabase
2. Jalankan SQL migration dari `supabase_migration_konsultasi_akademik.sql`:
   - Copy seluruh SQL ke Supabase SQL Editor
   - Jalankan query

### 5. Jalankan Development Server

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`

## Build & Production

### Build Production

```bash
npm run build
```

### Jalankan Production Build

```bash
npm run start
```

## Deployment ke Vercel

### 1. Push ke GitHub

```bash
git add .
git commit -m "Update dependencies"
git push origin main
```

### 2. Deploy di Vercel

1. Buka https://vercel.com
2. Klik "New Project"
3. Pilih repository SIKMA
4. Atur Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_CREATE_SECRET`
5. Klik "Deploy"

Build akan berjalan otomatis setiap kali push ke `main` branch.

## File Struktur

```
SIKMA/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Auth pages (login, register)
│   │   ├── (dashboard)/     # Protected pages (admin, dosen, mahasiswa, kajur)
│   │   └── api/             # API routes
│   ├── components/          # Reusable React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities & helpers
│   │   └── supabase/       # Supabase client configs
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── .env.local.example      # Environment variables template
├── .gitignore             # Git ignore patterns
├── next.config.mjs        # Next.js configuration
└── package.json           # Project dependencies
```

## Troubleshooting

### Build Warning Deprecated Packages

Semua deprecated packages sudah diupdate ke versi terbaru. Jika masih ada warning:

```bash
npm update
npm audit fix
```

### Environment Variables Tidak Terbaca

Pastikan file `.env.local` ada di root directory dan format benar:
```env
NEXT_PUBLIC_SUPABASE_URL=value
SUPABASE_SERVICE_ROLE_KEY=value
```

### Build Gagal di Vercel

1. Cek logs di Vercel dashboard
2. Pastikan semua environment variables sudah diset
3. Clear build cache di Vercel Settings > Git > Deployments > Clear Cache

## Contributing

1. Buat feature branch: `git checkout -b feature/nama-fitur`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push ke branch: `git push origin feature/nama-fitur`
4. Buat Pull Request

## License

MIT License

## Support

Untuk bantuan atau pertanyaan, silakan buka issue di repository ini.

---

**Status Build**: ![Vercel Build](https://img.shields.io/badge/vercel-live-success)
