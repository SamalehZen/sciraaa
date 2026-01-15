import { extractTextFromPDF } from './ocr-service';

export interface ProcessedAttachment {
  name: string;
  url: string;
  contentType: string;
  extractedText?: string;
  ocrSuccess?: boolean;
}

export interface PreprocessResult {
  processedMessages: any[];
  pdfExtractions: Array<{
    fileName: string;
    url: string;
    text: string;
    pages: number;
    tables: string[];
  }>;
}

function isPdfPart(part: any): boolean {
  if (part.type === 'file') {
    const mediaType = part.mediaType || part.mimeType || '';
    return mediaType === 'application/pdf';
  }
  return false;
}

function isPdfAttachment(att: any): boolean {
  const contentType = att.contentType || att.mediaType || '';
  const url = att.url || '';
  return contentType === 'application/pdf' || url.toLowerCase().endsWith('.pdf');
}

export async function preprocessPDFAttachments(messages: any[]): Promise<PreprocessResult> {
  const pdfExtractions: PreprocessResult['pdfExtractions'] = [];
  
  const processedMessages = await Promise.all(
    messages.map(async (message) => {
      const attachments = message.experimental_attachments || [];
      const parts = message.parts || [];
      
      const pdfAttachments = attachments.filter(isPdfAttachment);
      const pdfParts = parts.filter(isPdfPart);
      
      if (pdfAttachments.length === 0 && pdfParts.length === 0) {
        return message;
      }

      console.log(`📄 Found ${pdfAttachments.length} PDF attachments and ${pdfParts.length} PDF parts`);

      const nonPdfAttachments = attachments.filter((att: any) => !isPdfAttachment(att));
      const nonPdfParts = parts.filter((part: any) => !isPdfPart(part));

      const pdfUrls: Array<{ name: string; url: string }> = [];

      for (const att of pdfAttachments) {
        pdfUrls.push({
          name: att.name || 'document.pdf',
          url: att.url,
        });
      }

      for (const part of pdfParts) {
        if (part.data && typeof part.data === 'string') {
          if (part.data.startsWith('http')) {
            pdfUrls.push({
              name: part.name || 'document.pdf',
              url: part.data,
            });
          }
        }
      }

      if (pdfUrls.length === 0) {
        console.log('⚠️ No PDF URLs found to process');
        return {
          ...message,
          parts: nonPdfParts,
          experimental_attachments: nonPdfAttachments.length > 0 ? nonPdfAttachments : undefined,
        };
      }

      const ocrResults = await Promise.all(
        pdfUrls.map(async (pdf) => {
          try {
            console.log(`🔄 Processing PDF via OCR: ${pdf.name} (${pdf.url})`);
            const result = await extractTextFromPDF(pdf.url, 'fr');
            
            if (result.success) {
              console.log(`✅ PDF OCR success: ${pdf.name} (${result.pages} pages)`);
              pdfExtractions.push({
                fileName: pdf.name,
                url: pdf.url,
                text: result.text,
                pages: result.pages,
                tables: result.tables.map((t) => t.markdown),
              });
              return {
                success: true,
                fileName: pdf.name,
                text: result.markdown || result.text,
                pages: result.pages,
                tablesCount: result.tables.length,
              };
            } else {
              console.error(`❌ PDF OCR failed: ${pdf.name} - ${result.error}`);
              return {
                success: false,
                fileName: pdf.name,
                error: result.error,
              };
            }
          } catch (error) {
            console.error(`❌ PDF OCR error: ${pdf.name}`, error);
            return {
              success: false,
              fileName: pdf.name,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      const successfulExtractions = ocrResults.filter((r) => r.success);
      
      let pdfContentBlock = '';
      if (successfulExtractions.length > 0) {
        pdfContentBlock = successfulExtractions
          .map((extraction) => {
            if (extraction.success) {
              return `\n\n📄 **Contenu du fichier PDF "${extraction.fileName}"** (${extraction.pages} page(s), ${extraction.tablesCount} tableau(x)):\n\n${extraction.text}`;
            }
            return '';
          })
          .join('\n');
      }

      let updatedParts = [...nonPdfParts];
      
      const textPartIndex = updatedParts.findIndex((p: any) => p.type === 'text');
      
      if (pdfContentBlock) {
        if (textPartIndex >= 0) {
          updatedParts[textPartIndex] = {
            ...updatedParts[textPartIndex],
            text: updatedParts[textPartIndex].text + pdfContentBlock,
          };
        } else {
          updatedParts.push({
            type: 'text',
            text: pdfContentBlock.trim(),
          });
        }
      } else if (updatedParts.length === 0 || textPartIndex < 0) {
        updatedParts.push({
          type: 'text',
          text: 'Analyse le document PDF ci-joint.',
        });
      }

      if (updatedParts.length === 0) {
        updatedParts.push({
          type: 'text',
          text: 'Analyse le document.',
        });
      }

      return {
        ...message,
        parts: updatedParts,
        experimental_attachments: nonPdfAttachments.length > 0 ? nonPdfAttachments : undefined,
      };
    })
  );

  return {
    processedMessages,
    pdfExtractions,
  };
}

export function hasPDFAttachments(messages: any[]): boolean {
  return messages.some((message) => {
    const attachments = message.experimental_attachments || [];
    const parts = message.parts || [];
    
    const hasPdfAttachment = attachments.some(isPdfAttachment);
    const hasPdfPart = parts.some(isPdfPart);
    
    return hasPdfAttachment || hasPdfPart;
  });
}
