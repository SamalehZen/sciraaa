import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { z } from 'zod';
import { getUser } from '@/lib/auth-utils';
import { addAgentKnowledgeFile, deleteAgentKnowledgeFile, listAgentKnowledgeFiles } from '@/lib/db/queries';

const MAX_FILE_BYTES = 200 * 1024; // 200KB per file
const MAX_AGENT_TOTAL_BYTES = 1024 * 1024; // 1MB total per agent

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const agentId = (formData.get('agentId') as string | null) || null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const contentType = file.type || '';
    const name = file.name || '';
    const isTxt = contentType === 'text/plain' || /\.txt$/i.test(name);
    if (!isTxt) {
      return NextResponse.json({ error: 'Only .txt files are accepted' }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `File exceeds ${Math.round(MAX_FILE_BYTES / 1024)}KB limit` }, { status: 400 });
    }

    if (agentId) {
      const existingFiles = await listAgentKnowledgeFiles({ agentId, userId: user.id }).catch(() => []);
      const total = existingFiles.reduce((sum, f) => sum + (f.sizeBytes || 0), 0);
      if (total + file.size > MAX_AGENT_TOTAL_BYTES) {
        return NextResponse.json({ error: 'Agent total knowledge size cap exceeded (1MB)' }, { status: 400 });
      }
    }

    const blob = await put(`agents/${user.id}/${Date.now()}-${name}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    if (!agentId) {
      return NextResponse.json({
        id: null,
        title: name,
        sizeBytes: file.size,
        blobUrl: blob.url,
      });
    }

    const record = await addAgentKnowledgeFile({
      agentId,
      userId: user.id,
      title: name,
      blobUrl: blob.url,
      sizeBytes: file.size,
    });

    return NextResponse.json({ id: record.id, title: record.title, sizeBytes: record.sizeBytes });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await request.json();
    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'Invalid file id' }, { status: 400 });
    const deleted = await deleteAgentKnowledgeFile({ id, userId: user.id });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
