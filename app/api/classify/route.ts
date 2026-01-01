import { NextResponse } from 'next/server';
import { classifyProducts, parseArticlesFromText } from '@/lib/product-classifier';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));

  const articles: string[] = Array.isArray(body?.articles)
    ? body.articles.map((x: any) => String(x ?? '').trim()).filter(Boolean)
    : parseArticlesFromText(String(body?.text ?? ''));

  if (!articles.length) {
    return NextResponse.json(
      {
        ok: false,
        error: 'No articles provided',
        articles: [],
      },
      { status: 400 },
    );
  }

  const markdown = classifyProducts(articles);

  return NextResponse.json({ ok: true, articles, markdown });
}
