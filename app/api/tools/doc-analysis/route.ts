import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { docAnalysisTool } from '@/lib/tools/doc-analysis';

const FileMetaSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  type: z.string().min(1),
  size: z.number().min(0).max(25 * 1024 * 1024),
});

const BodySchema = z.object({
  prompt: z.string().optional().default(''),
  files: z.array(FileMetaSchema).min(1).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { prompt, files } = BodySchema.parse(json);

    const tool = docAnalysisTool(undefined);
    const result = await tool.execute({ prompt, files } as any);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    const message = err?.message || 'Unknown error';
    console.error('doc-analysis tool failed:', message);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
