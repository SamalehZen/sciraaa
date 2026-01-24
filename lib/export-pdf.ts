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
    .replace(/>/g, '&gt;');
};

const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre style="background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; padding: 14px; overflow-x: auto; font-family: Consolas, Monaco, monospace; font-size: 13px; line-height: 1.5; margin: 14px 0; color: #333;"><code>${escapeHtml(code.trim())}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });

  html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size: 15px; font-weight: 600; color: #222; margin: 18px 0 8px 0;">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 17px; font-weight: 600; color: #222; margin: 20px 0 10px 0;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 19px; font-weight: 700; color: #111; margin: 24px 0 12px 0;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '');

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 600; color: #111;">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: Consolas, monospace; font-size: 14px; color: #c7254e;">$1</code>');

  html = html.replace(/^>\s*(.+)$/gm, '<blockquote style="border-left: 4px solid #6366f1; padding: 10px 16px; margin: 16px 0; background-color: #f9fafb; color: #555;">$1</blockquote>');

  html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">');

  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^(\s*)[-*•]\s+(.+)$/);
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);

    if (bulletMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push('</ul>');
        inList = true;
        listType = 'ul';
        processedLines.push('<ul style="margin: 14px 0; padding-left: 24px; color: #333;">');
      }
      processedLines.push(`<li style="margin: 8px 0; line-height: 1.6;">${bulletMatch[2]}</li>`);
    } else if (numberedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push('</ol>');
        inList = true;
        listType = 'ol';
        processedLines.push('<ol style="margin: 14px 0; padding-left: 24px; color: #333;">');
      }
      processedLines.push(`<li style="margin: 8px 0; line-height: 1.6;">${numberedMatch[3]}</li>`);
    } else {
      if (inList && line.trim() === '') {
        continue;
      }
      if (inList && !line.match(/^\s+/)) {
        processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
        listType = '';
      }

      if (line.trim() === '') {
        processedLines.push('');
      } else if (line.startsWith('__CODE_BLOCK_')) {
        processedLines.push(line);
      } else if (!line.startsWith('<')) {
        processedLines.push(`<p style="margin: 12px 0; line-height: 1.7; color: #333; font-size: 15px;">${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  if (inList) {
    processedLines.push(listType === 'ul' ? '</ul>' : '</ol>');
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

  const wrapper = document.createElement('div');
  wrapper.id = 'pdf-export-wrapper';
  wrapper.style.cssText = 'position: fixed; left: -10000px; top: 0; z-index: -9999;';
  
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width: 800px; height: 2000px; border: none;';
  wrapper.appendChild(iframe);
  document.body.appendChild(wrapper);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(wrapper);
    throw new Error('Impossible de créer le document iframe');
  }

  iframeDoc.open();
  iframeDoc.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      background: #fff;
      color: #333;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div style="padding: 40px; background: #fff; color: #333;">
    
    <div style="border-bottom: 2px solid #e0e0e0; padding-bottom: 18px; margin-bottom: 28px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#6366f1" stroke="#6366f1" stroke-width="2"/>
        </svg>
        <span style="font-size: 24px; font-weight: 700; color: #111;">Scira AI</span>
      </div>
      <div style="font-size: 13px; color: #666;">
        Model: ${modelName} • Date: ${date}
      </div>
    </div>

    <h1 style="font-size: 26px; font-weight: 700; color: #111; margin-bottom: 28px; line-height: 1.3;">
      ${title}
    </h1>

    <div style="font-size: 15px; color: #333;">
      ${htmlContent}
    </div>

    <div style="margin-top: 50px; padding-top: 18px; border-top: 2px solid #e0e0e0; font-size: 11px; color: #999; text-align: center;">
      Generated by Scira AI • © ${new Date().getFullYear()} Scira AI
    </div>
  </div>
</body>
</html>
  `);
  iframeDoc.close();

  await new Promise(resolve => setTimeout(resolve, 100));

  const filename = `scira-ai-${generateSlug(title)}.pdf`;

  try {
    await html2pdf()
      .set({
        margin: [12, 12, 16, 12],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          backgroundColor: '#ffffff',
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        },
      })
      .from(iframeDoc.body)
      .save();
  } finally {
    document.body.removeChild(wrapper);
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
