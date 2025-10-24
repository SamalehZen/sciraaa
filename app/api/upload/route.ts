import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromHeaders } from '@/lib/local-session';

// Validation util
const isAllowedType = (t: string) => {
  const allowed = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // optional: legacy XLS
    'text/csv',
    'text/plain',
    // images remain allowed for compatibility
    'image/jpeg','image/jpg','image/png','image/gif','image/webp',
  ]);
  return allowed.has(t);
};

export async function POST(request: NextRequest) {
  let isAuthenticated = false;
  try { const sess = getSessionFromHeaders(request.headers as any); isAuthenticated = !!sess; } catch {}

  const formData = await request.formData();
  const files: File[] = [];

  // Collect files from common keys
  for (const [key, value] of formData.entries()) {
    if ((key === 'file' || key === 'files') && value instanceof File) {
      files.push(value);
    }
  }
  if (files.length === 0) {
    // Fallback: find all File entries
    for (const [, v] of formData.entries()) { if (v instanceof File) files.push(v); }
  }

  if (files.length === 0) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Validate each file
  const tooLarge: string[] = [];
  const badType: string[] = [];
  const valid: File[] = [];
  for (const f of files) {
    if (f.size > 25 * 1024 * 1024) { tooLarge.push(f.name); continue; }
    if (!isAllowedType(f.type || '')) { badType.push(f.name); continue; }
    valid.push(f);
  }
  if (valid.length === 0) {
    return NextResponse.json({ error: 'All files invalid', details: { tooLarge, badType } }, { status: 400 });
  }

  try {
    const prefix = isAuthenticated ? 'auth' : 'public';

    const uploads = await Promise.all(valid.map(async (file) => {
      const blob = await put(`mplx/${prefix}.${file.name.split('.').pop()}`, file, { access: 'public', addRandomSuffix: true });
      return { name: file.name, contentType: file.type, url: blob.url, size: file.size, authenticated: isAuthenticated };
    }));

    return NextResponse.json({ files: uploads, rejected: { tooLarge, badType } });
  } catch (error: any) {
    const errMsg = (error && (error.message || String(error))) || 'Unknown error';
    const blobTokenMissing = !process.env.BLOB_READ_WRITE_TOKEN || /BLOB|VERCEL_BLOB|token|auth/i.test(errMsg);
    if (blobTokenMissing) {
      console.error('Upload failed: Vercel Blob configuration missing or invalid:', errMsg);
      return NextResponse.json({ error: 'Failed to upload file', code: 'blob_config_missing' }, { status: 500 });
    }
    console.error('Error uploading file:', errMsg);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
