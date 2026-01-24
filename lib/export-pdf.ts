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

const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="main-title">$1</h1>');

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
    const numberedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);

    if (bulletMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) {
          processedLines.push(`</${listType}>`);
        }
        inList = true;
        listType = 'ul';
        processedLines.push('<ul>');
      }
      processedLines.push(`<li>${bulletMatch[2]}</li>`);
    } else if (numberedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) {
          processedLines.push(`</${listType}>`);
        }
        inList = true;
        listType = 'ol';
        processedLines.push('<ol>');
      }
      processedLines.push(`<li>${numberedMatch[2]}</li>`);
    } else {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = '';
      }

      if (line.trim() === '') {
        processedLines.push('');
      } else if (!line.startsWith('<h') && !line.startsWith('<ul') && !line.startsWith('<ol') && !line.startsWith('<li') && !line.startsWith('</')) {
        processedLines.push(`<p>${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }
  }

  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  return processedLines.join('\n');
};

const isIOS = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 800px; }
    .header { border-bottom: 1px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .logo-text { font-size: 20px; font-weight: 600; }
    .meta { font-size: 13px; color: #666666; }
    .main-title { font-size: 22px; font-weight: 700; margin-bottom: 24px; line-height: 1.3; }
    .content { font-size: 14px; color: #333333; }
    .content h1.main-title { display: none; }
    .content h2 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; }
    .content h3 { font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; }
    .content p { margin-bottom: 12px; }
    .content ul, .content ol { margin-left: 20px; margin-bottom: 16px; padding-left: 20px; }
    .content li { margin-bottom: 6px; }
    .content strong { font-weight: 600; }
    .content code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#6366f1" stroke="#6366f1" stroke-width="2"/>
      </svg>
      <span class="logo-text">Scira AI</span>
    </div>
    <div class="meta">Model: ${modelName} • Date: ${date}</div>
  </div>
  <h1 class="main-title">${title}</h1>
  <div class="content">${htmlContent}</div>
  <div class="footer">Generated by Scira AI • © ${new Date().getFullYear()} Scira AI</div>
</body>
</html>`;

  if (isIOS()) {
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      URL.revokeObjectURL(url);
      throw new Error('Popup bloqué. Autorisez les popups pour télécharger le PDF.');
    }
    return;
  }

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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.6; padding: 20px; background: white;">
      <div style="border-bottom: 1px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#6366f1" stroke="#6366f1" stroke-width="2"/>
          </svg>
          <span style="font-size: 20px; font-weight: 600;">Scira AI</span>
        </div>
        <div style="font-size: 13px; color: #666666;">Model: ${modelName} • Date: ${date}</div>
      </div>
      <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 24px; line-height: 1.3;">${title}</h1>
      <div style="font-size: 14px; color: #333333;">${htmlContent}</div>
      <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999999; text-align: center;">
        Generated by Scira AI • © ${new Date().getFullYear()} Scira AI
      </div>
    </div>
  `;
  container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white;';
  document.body.appendChild(container);

  const filename = `scira-ai-${generateSlug(title)}.pdf`;

  try {
    const worker = html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container);
    
    await worker.save();
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
