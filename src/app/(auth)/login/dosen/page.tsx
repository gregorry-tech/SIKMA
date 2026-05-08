'use client';

import React from 'react';
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function DosenLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">Login Dosen</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/40 sm:rounded-3xl sm:px-10 border border-gray-100">
          <LoginForm expectedRole="dosen" />
        </div>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          Atau <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors hover:underline">masuk sebagai peran lain</Link>
        </p>
      </div>
    </div>
  );
}
