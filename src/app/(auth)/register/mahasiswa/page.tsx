'use client';

import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterMahasiswaPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/></svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">Daftar Mahasiswa</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/40 sm:rounded-3xl sm:px-10 border border-gray-100">
          <RegisterForm role="mahasiswa" />
        </div>
        
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-sm text-gray-600">
            Sudah punya akun? <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">Masuk di sini</Link>
          </p>
          <p className="text-sm text-gray-500">
            Atau <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors hover:underline">daftar sebagai peran lain</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
