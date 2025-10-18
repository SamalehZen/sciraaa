
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { toCSV } from '@/lib/admin-utils';
import { db } from '@/lib/db';
import { auditLog, chat, lookout, message, user as appUser } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { listUsersWithStats } from '@/lib/db/admin-queries';

async function makePDF(title: string, rows: any[]) {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: any[] = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
  doc.fontSize(16).text(title, { underline: true });
  doc.moveDown();
  doc.fontSize(10);
  const max = Math.min(1000, rows.length);
  for (let i = 0; i < max; i++) {
    const line = JSON.stringify(rows[i]);
    doc.text(line.substring(0, 1000));
  }
  doc.end();
  const buf = await done;
  return new NextResponse(buf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"` } });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({} as any));
  const type = body.type as 'csv' | 'pdf';
  const resource = body.resource as 'users' | 'audit' | 'messages' | 'lookout';
  if (!type || !resource) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  if (resource === 'users') {
    const rows = await listUsersWithStats(10000, 0);
    if (type === 'csv') {
      const csv = toCSV(rows);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="users.csv"' } });
    }
    return makePDF('Users', rows);
  }

  if (resource === 'audit') {
    const rows = await db.select().from(auditLog).limit(10000);
    if (type === 'csv') {
      const csv = toCSV(rows);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="audit.csv"' } });
    }
    return makePDF('Audit Logs', rows);
  }

  if (resource === 'messages') {
    const rows = await db.select().from(message).limit(10000);
    if (type === 'csv') {
      const csv = toCSV(rows);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="messages.csv"' } });
    }
    return makePDF('Messages', rows);
  }

  if (resource === 'lookout') {
    const rows = await db.select().from(lookout).limit(10000);
    if (type === 'csv') {
      const csv = toCSV(rows);
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="lookout.csv"' } });
    }
    return makePDF('Lookout', rows);
  }

  return NextResponse.json({ error: 'Bad request' }, { status: 400 });
}