'use client';

import PptxGenJS from 'pptxgenjs';

export interface SlideData {
  type: 'cover' | 'content' | 'two-column' | 'statistics' | 'image-text' | 'quote' | 'timeline' | 'conclusion';
  title?: string;
  subtitle?: string;
  points?: string[];
  left?: { title: string; points: string[] };
  right?: { title: string; points: string[] };
  stats?: Array<{ value: string; label: string; description?: string }>;
  imageDescription?: string;
  text?: string;
  quote?: string;
  author?: string;
  context?: string;
  events?: Array<{ year: string; label: string; description?: string }>;
  keyMessage?: string;
  cta?: string;
}

export interface PresentationData {
  title: string;
  template: TemplateName;
  slides: SlideData[];
}

export type TemplateName = 'deep-tech' | 'corporate-clean' | 'creative-bold' | 'academic-elegant' | 'warm-modern';

interface TemplateColors {
  bg: string;
  bgAlt: string;
  primary: string;
  secondary: string;
  accent: string;
  accentAlt: string;
  muted: string;
  cardBg: string;
  cardBorder: string;
}

interface Template {
  name: string;
  colors: TemplateColors;
  fontHeading: string;
  fontBody: string;
}

const TEMPLATES: Record<TemplateName, Template> = {
  'deep-tech': {
    name: 'Deep Tech',
    colors: {
      bg: '0A0E27',
      bgAlt: '111638',
      primary: 'FFFFFF',
      secondary: 'B0B8D1',
      accent: '00D9FF',
      accentAlt: '7C3AED',
      muted: '6B7280',
      cardBg: '151A3A',
      cardBorder: '1E2550',
    },
    fontHeading: 'Segoe UI',
    fontBody: 'Segoe UI',
  },
  'corporate-clean': {
    name: 'Corporate Clean',
    colors: {
      bg: 'F3F1ED',
      bgAlt: 'FFFFFF',
      primary: '1A1A2E',
      secondary: '4A5568',
      accent: '15857A',
      accentAlt: '0D5C54',
      muted: '9CA3AF',
      cardBg: 'FFFFFF',
      cardBorder: 'E2E0DC',
    },
    fontHeading: 'Segoe UI',
    fontBody: 'Segoe UI',
  },
  'creative-bold': {
    name: 'Creative Bold',
    colors: {
      bg: '1A1A2E',
      bgAlt: '16213E',
      primary: 'FFFFFF',
      secondary: 'CBD5E1',
      accent: 'FF6A3B',
      accentAlt: 'F59E0B',
      muted: '94A3B8',
      cardBg: '1E2745',
      cardBorder: '2D3A5C',
    },
    fontHeading: 'Segoe UI',
    fontBody: 'Segoe UI',
  },
  'academic-elegant': {
    name: 'Academic Elegant',
    colors: {
      bg: 'FFFFFF',
      bgAlt: 'F8FAFC',
      primary: '1E293B',
      secondary: '475569',
      accent: '4F46E5',
      accentAlt: '7C3AED',
      muted: '94A3B8',
      cardBg: 'F1F5F9',
      cardBorder: 'E2E8F0',
    },
    fontHeading: 'Georgia',
    fontBody: 'Segoe UI',
  },
  'warm-modern': {
    name: 'Warm Modern',
    colors: {
      bg: 'FFF7ED',
      bgAlt: 'FFFFFF',
      primary: '1C1917',
      secondary: '57534E',
      accent: 'E11D48',
      accentAlt: 'DB2777',
      muted: 'A8A29E',
      cardBg: 'FFFFFF',
      cardBorder: 'FED7AA',
    },
    fontHeading: 'Segoe UI',
    fontBody: 'Segoe UI',
  },
};

function addDecorations(slide: PptxGenJS.Slide, t: Template, slideType: string, slideIndex: number) {
  const c = t.colors;

  if (slideType === 'cover') {
    slide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: '100%',
      fill: { color: c.bg },
    });
    slide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: 0.06,
      fill: { color: c.accent },
    });
    slide.addShape('ellipse', {
      x: 7.5, y: -1.5, w: 4, h: 4,
      fill: { color: c.accent, transparency: 90 },
    });
    slide.addShape('ellipse', {
      x: -1, y: 3.5, w: 3, h: 3,
      fill: { color: c.accentAlt, transparency: 92 },
    });
  } else {
    slide.addShape('rect', {
      x: 0, y: 0, w: '100%', h: '100%',
      fill: { color: (slideIndex % 2 === 0) ? c.bg : c.bgAlt },
    });
    slide.addShape('rect', {
      x: 0, y: 0, w: 0.08, h: '100%',
      fill: { color: c.accent },
    });
    slide.addShape('rect', {
      x: 0, y: 5.15, w: '100%', h: 0.03,
      fill: { color: c.cardBorder },
    });
  }
}

function addSlideNumber(slide: PptxGenJS.Slide, num: number, total: number, t: Template) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5, y: 5.2, w: 1.2, h: 0.3,
    fontSize: 9,
    color: t.colors.muted,
    fontFace: t.fontBody,
    align: 'right',
  });
}

function renderCover(slide: PptxGenJS.Slide, data: SlideData, t: Template) {
  addDecorations(slide, t, 'cover', 0);

  slide.addText(data.title || 'Presentation', {
    x: 0.8, y: 1.4, w: 8.4, h: 1.4,
    fontSize: 40,
    fontFace: t.fontHeading,
    color: t.colors.primary,
    bold: true,
    align: 'left',
    lineSpacingMultiple: 1.1,
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.8, y: 2.9, w: 7, h: 0.8,
      fontSize: 20,
      fontFace: t.fontBody,
      color: t.colors.accent,
      align: 'left',
    });
  }

  slide.addShape('rect', {
    x: 0.8, y: 3.9, w: 1.5, h: 0.04,
    fill: { color: t.colors.accent },
  });

  const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  slide.addText(today, {
    x: 0.8, y: 4.2, w: 4, h: 0.4,
    fontSize: 12,
    fontFace: t.fontBody,
    color: t.colors.muted,
  });
}

function renderContent(slide: PptxGenJS.Slide, data: SlideData, t: Template, idx: number, total: number) {
  addDecorations(slide, t, 'content', idx);

  slide.addText(data.title || '', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26,
    fontFace: t.fontHeading,
    color: t.colors.primary,
    bold: true,
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.5, y: 0.9, w: 9, h: 0.4,
      fontSize: 14,
      fontFace: t.fontBody,
      color: t.colors.secondary,
    });
  }

  if (data.points && data.points.length > 0) {
    const startY = data.subtitle ? 1.5 : 1.2;
    const pointHeight = 0.55;

    data.points.forEach((point, i) => {
      const y = startY + (i * pointHeight);

      slide.addShape('ellipse', {
        x: 0.6, y: y + 0.15, w: 0.12, h: 0.12,
        fill: { color: t.colors.accent },
      });

      slide.addText(point, {
        x: 0.95, y: y, w: 8.6, h: pointHeight,
        fontSize: 16,
        fontFace: t.fontBody,
        color: t.colors.primary,
        valign: 'middle',
      });
    });
  }

  addSlideNumber(slide, idx + 1, total, t);
}

function renderTwoColumn(slide: PptxGenJS.Slide, data: SlideData, t: Template, idx: number, total: number) {
  addDecorations(slide, t, 'two-column', idx);

  slide.addText(data.title || '', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26,
    fontFace: t.fontHeading,
    color: t.colors.primary,
    bold: true,
  });

  const colWidth = 4.2;
  const colStartY = 1.2;

  [
    { col: data.left, x: 0.5 },
    { col: data.right, x: 5.3 },
  ].forEach(({ col, x }) => {
    if (!col) return;

    slide.addShape('roundRect', {
      x, y: colStartY, w: colWidth, h: 3.7,
      rectRadius: 0.1,
      fill: { color: t.colors.cardBg },
      line: { color: t.colors.cardBorder, width: 1 },
    });

    slide.addShape('rect', {
      x: x, y: colStartY, w: colWidth, h: 0.06,
      fill: { color: t.colors.accent },
      rectRadius: 0.1,
    });

    slide.addText(col.title || '', {
      x: x + 0.3, y: colStartY + 0.2, w: colWidth - 0.6, h: 0.5,
      fontSize: 16,
      fontFace: t.fontHeading,
      color: t.colors.accent,
      bold: true,
    });

    col.points?.forEach((point, i) => {
      slide.addText(`• ${point}`, {
        x: x + 0.3, y: colStartY + 0.8 + (i * 0.5), w: colWidth - 0.6, h: 0.45,
        fontSize: 13,
        fontFace: t.fontBody,
        color: t.colors.primary,
        valign: 'top',
      });
    });
  });

  addSlideNumber(slide, idx + 1, total, t);
}

function renderStatistics(slide: PptxGenJS.Slide, data: SlideData, t: Template, idx: number, total: number) {
  addDecorations(slide, t, 'statistics', idx);

  slide.addText(data.title || '', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26,
    fontFace: t.fontHeading,
    color: t.colors.primary,
    bold: true,
  });

  const stats = data.stats || [];
  const count = Math.min(stats.length, 4);
  const cardWidth = count <= 2 ? 4.2 : (9 / count) - 0.15;
  const totalWidth = (cardWidth * count) + (0.3 * (count - 1));
  const startX = (10 - totalWidth) / 2;

  stats.slice(0, 4).forEach((stat, i) => {
    const x = startX + (i * (cardWidth + 0.3));

    slide.addShape('roundRect', {
      x, y: 1.4, w: cardWidth, h: 3.2,
      rectRadius: 0.1,
      fill: { color: t.colors.cardBg },
      line: { color: t.colors.cardBorder, width: 1 },
    });

    slide.addShape('rect', {
      x: x + 0.3, y: 1.7, w: 0.5, h: 0.06,
      fill: { color: t.colors.accent },
    });

    slide.addText(stat.value, {
      x, y: 2.0, w: cardWidth, h: 0.8,
      fontSize: 32,
      fontFace: t.fontHeading,
      color: t.colors.accent,
      bold: true,
      align: 'center',
    });

    slide.addText(stat.label, {
      x, y: 2.8, w: cardWidth, h: 0.5,
      fontSize: 15,
      fontFace: t.fontHeading,
      color: t.colors.primary,
      bold: true,
      align: 'center',
    });

    if (stat.description) {
      slide.addText(stat.description, {
        x: x + 0.2, y: 3.3, w: cardWidth - 0.4, h: 0.8,
        fontSize: 11,
        fontFace: t.fontBody,
        color: t.colors.secondary,
        align: 'center',
        valign: 'top',
      });
    }
  });

  addSlideNumber(slide, idx + 1, total, t);
}

function renderImageText(slide: PptxGenJS.Slide, data: SlideData, t: Template, idx: number, total: number) {
  addDecorations(slide, t, 'image-text', idx);

  slide.addShape('roundRect', {
    x: 0.5, y: 0.4, w: 4.2, h: 4.5,
    rectRadius: 0.1,
    fill: { color: t.colors.cardBg },
    line: { color: t.colors.cardBorder, width: 1, dashType: 'dash' },
  });

  slide.addText(data.imageDescription || 'Image', {
    x: 0.8, y: 2.2, w: 3.6, h: 0.8,
    fontSize: 12,
    fontFace: t.fontBody,
    color: t.colors.muted,
    align: 'center',
    italic: true,
  });

  slide.addText(data.title || '', {
    x: 5.2, y: 0.4, w: 4.5, h: 0.6,
    fontSize: 24,
    fontFace: t.fontHeading,
    color: t.colors.primary,
    bold: true,
  });

  if (data.text) {
    slide.addText(data.text, {
      x: 5.2, y: 1.2, w: 4.5, h: 1.2,
      fontSize: 14,
      fontFace: t.fontBody,
      color: t.colors.secondary,
      valign: 'top',
    });
  }

  data.points?.forEach((point, i) => {
    slide.addText(`• ${point}`, {
      x: 5.2, y: 2.6 + (i * 0.5), w: 4.5, h: 0.45,
      fontSize: 14,
      fontFace: t.fontBody,
      color: t.colors.primary,
    });
  });

  addSlideNumber(slide, idx + 1, total, t);
}

function renderQuote(slide: PptxGenJS.Slide, data: SlideData, t: Template, idx: number, total: number) {
  addDecorations(slide, t, 'quote', idx);

  slide.addText('\u201C', {
    x: 0.8, y: 0.8, w: 1, h: 1,
    fontSize: 80,
    fontFace: 'Georgia',
    color: t.colors.accent,
    bold: true,
  });

  slide.addText(data.quote || '', {
    x: 1.2, y: 1.6, w: 7.6, h: 2,
    fontSize: 22,
    fontFace: 'Georgia',
    color: t.colors.primary,
    italic: true,
    align: 'center',
    valign: 'middle',
    lineSpacingMultiple: 1.4,
  });

  slide.addShape('rect', {
    x: 4.2, y: 3.7, w: 1.6, h: 0.04,
    fill: { color: t.colors.accent },
  });

  if (data.author) {
    slide.addText(`\u2014 ${data.author}`, {
      x: 1.2, y: 4.0, w: 7.6, h: 0.5,
      fontSize: 16,
      fontFace: t.fontHeading,
      color: t.colors.accent,
      bold: true,
      align: 'center',
    });
  }

  if (data.context) {
    slide.addText(data.context, {
      x: 1.2, y: 4.4, w: 7.6, h: 0.4,
      fontSize: 12,
      fontFace: t.fontBody,
      color: t.colors.muted,
      align: 'center',
    });
  }

  addSlideNumber(slide, idx + 1, total, t);
}

function renderTimeline(slide: PptxGenJS.Slide, data: SlideData, t: Template, idx: number, total: number) {
  addDecorations(slide, t, 'timeline', idx);

  slide.addText(data.title || '', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26,
    fontFace: t.fontHeading,
    color: t.colors.primary,
    bold: true,
  });

  const events = data.events || [];
  const count = Math.min(events.length, 5);
  const lineY = 2.5;

  slide.addShape('rect', {
    x: 0.8, y: lineY, w: 8.4, h: 0.04,
    fill: { color: t.colors.accent },
  });

  const spacing = 8.4 / Math.max(count - 1, 1);

  events.slice(0, 5).forEach((event, i) => {
    const x = 0.8 + (i * spacing);

    slide.addShape('ellipse', {
      x: x - 0.12, y: lineY - 0.12, w: 0.28, h: 0.28,
      fill: { color: t.colors.accent },
    });

    slide.addText(event.year, {
      x: x - 0.8, y: lineY - 0.8, w: 1.6, h: 0.5,
      fontSize: 14,
      fontFace: t.fontHeading,
      color: t.colors.accent,
      bold: true,
      align: 'center',
    });

    slide.addText(event.label, {
      x: x - 0.8, y: lineY + 0.4, w: 1.6, h: 0.4,
      fontSize: 13,
      fontFace: t.fontHeading,
      color: t.colors.primary,
      bold: true,
      align: 'center',
    });

    if (event.description) {
      slide.addText(event.description, {
        x: x - 0.9, y: lineY + 0.8, w: 1.8, h: 0.8,
        fontSize: 10,
        fontFace: t.fontBody,
        color: t.colors.secondary,
        align: 'center',
        valign: 'top',
      });
    }
  });

  addSlideNumber(slide, idx + 1, total, t);
}

function renderConclusion(slide: PptxGenJS.Slide, data: SlideData, t: Template, idx: number, total: number) {
  addDecorations(slide, t, 'conclusion', idx);

  slide.addText(data.title || 'Conclusion', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26,
    fontFace: t.fontHeading,
    color: t.colors.primary,
    bold: true,
  });

  if (data.keyMessage) {
    slide.addShape('roundRect', {
      x: 0.5, y: 1.1, w: 9, h: 1,
      rectRadius: 0.1,
      fill: { color: t.colors.cardBg },
      line: { color: t.colors.accent, width: 2 },
    });

    slide.addText(data.keyMessage, {
      x: 0.8, y: 1.1, w: 8.4, h: 1,
      fontSize: 18,
      fontFace: t.fontHeading,
      color: t.colors.accent,
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  }

  const startY = data.keyMessage ? 2.4 : 1.3;
  data.points?.forEach((point, i) => {
    slide.addShape('roundRect', {
      x: 0.65, y: startY + (i * 0.55) + 0.1, w: 0.2, h: 0.2,
      rectRadius: 0.04,
      fill: { color: t.colors.accent },
    });

    slide.addText(point, {
      x: 1.1, y: startY + (i * 0.55), w: 8.4, h: 0.5,
      fontSize: 15,
      fontFace: t.fontBody,
      color: t.colors.primary,
      valign: 'middle',
    });
  });

  if (data.cta) {
    const ctaY = startY + ((data.points?.length || 0) * 0.55) + 0.5;

    slide.addShape('roundRect', {
      x: 2.5, y: ctaY, w: 5, h: 0.7,
      rectRadius: 0.35,
      fill: { color: t.colors.accent },
    });

    slide.addText(data.cta, {
      x: 2.5, y: ctaY, w: 5, h: 0.7,
      fontSize: 16,
      fontFace: t.fontHeading,
      color: 'FFFFFF',
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  }

  addSlideNumber(slide, idx + 1, total, t);
}

export function parseHyperslideJson(markdown: string): PresentationData | null {
  const match = markdown.match(/```hyperslide\s*\n([\s\S]*?)```/);
  if (!match) return null;

  try {
    const json = JSON.parse(match[1].trim());
    if (!json.slides || !Array.isArray(json.slides)) return null;
    return json as PresentationData;
  } catch {
    return null;
  }
}

export async function generatePptxFromData(data: PresentationData): Promise<Blob> {
  const templateName = data.template && TEMPLATES[data.template] ? data.template : 'deep-tech';
  const template = TEMPLATES[templateName];

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'HyperSlide';
  pptx.title = data.title || 'Presentation';

  const totalSlides = data.slides.length;

  data.slides.forEach((slideData, idx) => {
    const slide = pptx.addSlide();

    switch (slideData.type) {
      case 'cover':
        renderCover(slide, slideData, template);
        break;
      case 'content':
        renderContent(slide, slideData, template, idx, totalSlides);
        break;
      case 'two-column':
        renderTwoColumn(slide, slideData, template, idx, totalSlides);
        break;
      case 'statistics':
        renderStatistics(slide, slideData, template, idx, totalSlides);
        break;
      case 'image-text':
        renderImageText(slide, slideData, template, idx, totalSlides);
        break;
      case 'quote':
        renderQuote(slide, slideData, template, idx, totalSlides);
        break;
      case 'timeline':
        renderTimeline(slide, slideData, template, idx, totalSlides);
        break;
      case 'conclusion':
        renderConclusion(slide, slideData, template, idx, totalSlides);
        break;
      default:
        renderContent(slide, slideData, template, idx, totalSlides);
    }
  });

  const result = await pptx.write({ outputType: 'blob' });
  return result as Blob;
}

export async function downloadPptx(data: PresentationData): Promise<void> {
  const blob = await generatePptxFromData(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = (data.title || 'presentation')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  a.href = url;
  a.download = `hyperslide-${slug}.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function hasHyperslideContent(text: string): boolean {
  return /```hyperslide\s*\n/i.test(text);
}
