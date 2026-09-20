'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/index';

interface FileUploadProps {
  kind: 'video' | 'image' | 'quiz';
  onUploaded: (publicUrl: string) => void;
  accept: string;
  label?: string;
}

/**
 * Uploads a file directly from the browser to S3-compatible storage using a
 * presigned URL from /api/admin/uploads/presign. The file never passes
 * through our Next.js server (important for multi-GB video files).
 *
 * If storage isn't configured server-side, this shows a clear message
 * instead of silently failing — the admin can still paste a hosted URL
 * manually in the field next to this control.
 */
export default function FileUpload({ kind, onUploaded, accept, label }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setProgress(0);

    try {
      const presignRes = await fetch('/api/admin/uploads/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, contentType: file.type, fileName: file.name })
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || 'Failed to prepare upload.');

      if (file.size > presignData.maxBytes) {
        throw new Error(`File is too large. Max size for ${kind}s is ${Math.round(presignData.maxBytes / (1024 * 1024))}MB.`);
      }

      await uploadWithProgress(presignData.uploadUrl, file, setProgress);

      onUploaded(presignData.publicUrl);
      setProgress(null);
    } catch (err: any) {
      setError(err.message);
      setProgress(null);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" id={`upload-${kind}`} />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="!px-4 !py-2 text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
        >
          {progress !== null ? `Uploading… ${progress}%` : label || `Upload ${kind}`}
        </Button>
        {fileName && progress === null && !error && <span className="text-xs text-white/40">{fileName} ✓</span>}
      </div>
      {progress !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-cf-gold transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-xs text-cf-red">{error}</p>}
    </div>
  );
}

function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error('Upload to storage failed.'));
    };
    xhr.onerror = () => reject(new Error('Upload to storage failed — check your connection.'));

    xhr.send(file);
  });
}
