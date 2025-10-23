import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'HTML manquant' }, { status: 400 });
    }

    // Attempt serverless PDF render; gracefully degrade if deps unavailable
    try {
      const chromium = await import('chrome-aws-lambda');
      const puppeteer = await import('puppeteer-core');

      const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: true,
        defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 2 },
      } as any);
      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        printBackground: true,
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' },
      });
      await browser.close();

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="rapport.pdf"',
        },
      });
    } catch (e) {
      // Fallback: return HTML if PDF rendering deps are not installed in dev
      return NextResponse.json({ fallback: true, message: 'PDF non disponible en dev; renvoi HTML brut', html }, { status: 200 });
    }
  } catch (error) {
    console.error('[report/pdf] error', error);
    return NextResponse.json({ error: 'Échec de génération PDF' }, { status: 500 });
  }
}
