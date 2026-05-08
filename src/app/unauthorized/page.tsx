'use client';

import React from 'react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
        <p className="text-sm text-gray-600 mb-6">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="px-4 py-2 rounded-md bg-blue-600 text-white">Masuk</Link>
          <Link href="/" className="px-4 py-2 rounded-md border">Beranda</Link>
        </div>
      </div>
    </div>
  );
}
