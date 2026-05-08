'use client';

import React, { useRef, useState, useCallback } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  uploading?: boolean;
  progress?: number;
}

const VALID_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function FileUpload({
  onFilesSelected,
  accept = '.pdf,.doc,.docx',
  maxSizeMB = 50,
  multiple = false,
  uploading = false,
  progress = 0,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const validateFiles = useCallback(
    (files: FileList | File[]) => {
      const errs: string[] = [];
      const valid: File[] = [];

      Array.from(files).forEach((file) => {
        if (!VALID_TYPES.includes(file.type)) {
          errs.push(`"${file.name}" bukan format yang diizinkan (PDF/Word).`);
        } else if (file.size > maxSizeMB * 1024 * 1024) {
          errs.push(`"${file.name}" melebihi batas ukuran ${maxSizeMB}MB.`);
        } else {
          valid.push(file);
        }
      });

      setErrors(errs);
      if (valid.length > 0) {
        setSelectedFiles(valid);
        onFilesSelected(valid);
      }
    },
    [maxSizeMB, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      validateFiles(e.dataTransfer.files);
    },
    [validateFiles]
  );

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && validateFiles(e.target.files)}
        />
        <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium text-gray-700">Drag & drop file di sini, atau <span className="text-blue-600">pilih file</span></p>
        <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (maks. {maxSizeMB}MB)</p>
      </div>

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {selectedFiles.length > 0 && (
        <ul className="space-y-1">
          {selectedFiles.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="truncate flex-1">{f.name}</span>
              <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
            </li>
          ))}
        </ul>
      )}

      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-sm text-red-600">{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
