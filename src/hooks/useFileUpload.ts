'use client';

import { useState } from 'react';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (consultationId: string, file: File, description?: string) => {
    setUploading(true);
    setProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);

      setProgress(40);

      const res = await fetch(`/api/consultations/${consultationId}/documents`, {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Upload gagal');
      }

      setProgress(100);
      const json = await res.json();
      return json;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, progress, error };
}
