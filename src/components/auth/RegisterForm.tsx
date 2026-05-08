'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';

type Props = { role: 'mahasiswa' | 'dosen' };

export default function RegisterForm({ role }: Props) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '', nim: '', nidn: '', semester: '', program_studi: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) { setError('Password dan konfirmasi tidak cocok.'); return; }
    if (form.password.length < 6) { setError('Password minimal 6 karakter.'); return; }
    if (role === 'mahasiswa' && !form.nim) { setError('NIM wajib diisi untuk mahasiswa.'); return; }
    if (role === 'dosen' && !form.nidn) { setError('NIDN wajib diisi untuk dosen.'); return; }

    setLoading(true);
    try {
      const payload: any = { ...form, role };
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  if (success) {
    return (
      <div className="text-center py-10 px-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Registrasi Berhasil!</h3>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Akun Anda telah berhasil dibuat. Silakan masuk untuk melanjutkan ke sistem.</p>
        <a href="/login" className="inline-block w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">Masuk ke Akun</a>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="w-full">
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
            <svg className="w-12 h-12 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-bold text-gray-800 tracking-tight">Memproses...</p>
            <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4" onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as any) }}>
        <div>
          <label className={labelClass}>Nama Lengkap</label>
          <input type="text" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required placeholder="Nama lengkap" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email Address</label>
          <input type="email" name="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="nama@email.com" className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} name="password" autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} required placeholder="Min. 6 karakter" className={`${inputClass} pr-12`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none">
                {showPassword ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Konfirmasi</label>
            <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required placeholder="Ulangi password" className={inputClass} />
          </div>
        </div>

        {role === 'mahasiswa' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>NIM</label>
              <input type="text" value={form.nim} onChange={(e) => update('nim', e.target.value)} placeholder="Nomor Induk" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Semester</label>
              <select value={form.semester} onChange={(e) => update('semester', e.target.value)} className={inputClass}>
                <option value="">Pilih Semester</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
        )}

        {role === 'dosen' && (
          <div>
            <label className={labelClass}>NIDN</label>
            <input type="text" value={form.nidn} onChange={(e) => update('nidn', e.target.value)} placeholder="Nomor Induk Dosen" className={inputClass} />
          </div>
        )}

        <div>
          <label className={labelClass}>Program Studi</label>
          <input type="text" value={form.program_studi} onChange={(e) => update('program_studi', e.target.value)} placeholder="Contoh: Teknik Informatika" className={inputClass} />
        </div>

        <Button type="button" onClick={handleSubmit as any} loading={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow transition-all duration-200 mt-4">Buat Akun</Button>
      </div>
    </div>
  );
}
