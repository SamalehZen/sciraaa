import { NextRequest, NextResponse } from 'next/server';

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'https://hyper-ocr-service.onrender.com';

interface OCRResponse {
  success: boolean;
  raw_text: string;
  tables: Array<{
    html: string;
    markdown: string;
    cells: Array<{ text: string; row: number; col: number }>;
  }>;
  markdown_output: string;
  pages: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileUrl = formData.get('file_url') as string | null;
    const language = (formData.get('language') as string) || 'fr';

    if (!file && !fileUrl) {
      return NextResponse.json(
        { error: 'File or file_url required' },
        { status: 400 }
      );
    }

    let ocrResponse: Response;

    if (file) {
      const ocrFormData = new FormData();
      ocrFormData.append('file', file);
      ocrFormData.append('language', language);

      ocrResponse = await fetch(`${OCR_SERVICE_URL}/ocr/extract-structured`, {
        method: 'POST',
        body: ocrFormData,
      });
    } else {
      ocrResponse = await fetch(`${OCR_SERVICE_URL}/ocr/extract-from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl, language }),
      });
    }

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error('OCR Service error:', errorText);
      return NextResponse.json(
        { error: `OCR service error: ${ocrResponse.status}` },
        { status: 502 }
      );
    }

    const result: OCRResponse = await ocrResponse.json();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'OCR extraction failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      text: result.raw_text,
      markdown: result.markdown_output,
      tables: result.tables.map((t) => ({
        markdown: t.markdown,
        html: t.html,
      })),
      pages: result.pages,
    });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const healthResponse = await fetch(`${OCR_SERVICE_URL}/health`, {
      method: 'GET',
    });

    if (!healthResponse.ok) {
      return NextResponse.json(
        { status: 'unhealthy', service_url: OCR_SERVICE_URL },
        { status: 503 }
      );
    }

    const healthData = await healthResponse.json();
    return NextResponse.json({
      status: 'healthy',
      service: healthData,
      service_url: OCR_SERVICE_URL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Connection failed',
        service_url: OCR_SERVICE_URL,
      },
      { status: 503 }
    );
  }
}
