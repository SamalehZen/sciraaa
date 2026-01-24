'use client';

export interface PdfExportOptions {
  content: string;
  modelName?: string;
  title?: string;
}

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
};

const extractTitle = (markdown: string): string => {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  const h2Match = markdown.match(/^##\s+(.+)$/m);
  if (h2Match) return h2Match[1].trim();

  const boldMatch = markdown.match(/\*\*([^*]+)\*\*/);
  if (boldMatch) return boldMatch[1].trim();

  const firstLine = markdown.split('\n').find((line) => line.trim().length > 10);
  if (firstLine) {
    const cleaned = firstLine.replace(/[#*_`]/g, '').trim();
    return cleaned.length > 60 ? cleaned.slice(0, 60) + '...' : cleaned;
  }

  return 'Scira AI Response';
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; overflow-x: auto; font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 13px; line-height: 1.5; margin: 16px 0;"><code>${escapeHtml(code.trim())}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });

  html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 20px 0 10px 0; line-height: 1.4;">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 24px 0 12px 0; line-height: 1.4;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 28px 0 14px 0; line-height: 1.3;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3; display: none;">$1</h1>');

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 600; color: #1a1a1a;">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; color: #e11d48;">$1</code>');

  html = html.replace(/^>\s*(.+)$/gm, '<blockquote style="border-left: 4px solid #6366f1; padding: 12px 20px; margin: 20px 0; background: #f8fafc; border-radius: 0 8px 8px 0; font-style: italic; color: #475569;">$1</blockquote>');

  html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;">');

  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listType = '';
  let listIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^(\s*)[-*•]\s+(.+)$/);
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);

    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(`</${listType}>`);
        inList = true;
        listType = 'ul';
        listIndent = indent;
        processedLines.push('<ul style="margin: 16px 0; padding-left: 28px; list-style-type: disc;">');
      }
      processedLines.push(`<li style="margin: 10px 0; line-height: 1.7; color: #374151;">${bulletMatch[2]}</li>`);
    } else if (numberedMatch) {
      const indent = numberedMatch[1].length;
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(`</${listType}>`);
        inList = true;
        listType = 'ol';
        listIndent = indent;
        processedLines.push('<ol style="margin: 16px 0; padding-left: 28px; list-style-type: decimal;">');
      }
      processedLines.push(`<li style="margin: 10px 0; line-height: 1.7; color: #374151;">${numberedMatch[3]}</li>`);
    } else {
      if (inList && line.trim() === '') {
        continue;
      }
      if (inList && !line.match(/^\s+/)) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = '';
      }

      if (line.trim() === '') {
        processedLines.push('');
      } else if (line.startsWith('__CODE_BLOCK_')) {
        processedLines.push(line);
      } else if (!line.startsWith('<h') && !line.startsWith('<ul') && !line.startsWith('<ol') && !line.startsWith('<li') && !line.startsWith('</') && !line.startsWith('<blockquote') && !line.startsWith('<hr')) {
        processedLines.push(`<p style="margin: 14px 0; line-height: 1.8; color: #374151; font-size: 16px;">${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  html = processedLines.join('\n');

  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });

  return html;
};

export const generatePdfFromMarkdown = async (options: PdfExportOptions): Promise<void> => {
  const { content, modelName = 'Gemini', title: customTitle } = options;

  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in browser');
  }

  const title = customTitle || extractTitle(content);
  const date = new Date().toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const htmlContent = markdownToHtml(content);

  let html2pdf: any;
  try {
    const module = await import('html2pdf.js');
    html2pdf = module.default || module;
  } catch (importError) {
    throw new Error(`Import html2pdf échoué: ${importError}`);
  }

  if (!html2pdf) {
    throw new Error('html2pdf module non chargé');
  }

  const container = document.createElement('div');
  container.innerHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.7; padding: 40px; background: white; max-width: 100%;">
      
      <!-- Header -->
      <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#6366f1" stroke="#6366f1" stroke-width="2"/>
          </svg>
          <span style="font-size: 26px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px;">Scira AI</span>
        </div>
        <div style="font-size: 14px; color: #6b7280; font-weight: 500;">
          Model: ${modelName} • Date: ${date}
        </div>
      </div>

      <!-- Main Title -->
      <h1 style="font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 32px; line-height: 1.3; letter-spacing: -0.5px;">
        ${title}
      </h1>

      <!-- Content -->
      <div style="font-size: 16px; color: #374151;">
        ${htmlContent}
      </div>

      <!-- Footer -->
      <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; font-weight: 500;">
        Generated by Scira AI • © ${new Date().getFullYear()} Scira AI
      </div>
    </div>
  `;
  container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white;';
  document.body.appendChild(container);

  const filename = `scira-ai-${generateSlug(title)}.pdf`;

  try {
    await html2pdf()
      .set({
        margin: [15, 15, 20, 15],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          windowWidth: 800,
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(container)
      .save();
  } catch (pdfError) {
    throw new Error(`Génération PDF échouée: ${pdfError}`);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

export const downloadResponseAsPdf = async (
  markdownContent: string,
  modelName?: string,
  customTitle?: string,
): Promise<void> => {
  return generatePdfFromMarkdown({
    content: markdownContent,
    modelName,
    title: customTitle,
  });
};
