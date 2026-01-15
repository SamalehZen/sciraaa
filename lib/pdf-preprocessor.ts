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

export async function preprocessPDFAttachments(messages: any[]): Promise<PreprocessResult> {
  const pdfExtractions: PreprocessResult['pdfExtractions'] = [];
  
  const processedMessages = await Promise.all(
    messages.map(async (message) => {
      if (!message.experimental_attachments || message.experimental_attachments.length === 0) {
        return message;
      }

      const attachments = message.experimental_attachments as Array<{
        name: string;
        url: string;
        contentType?: string;
      }>;

      const pdfAttachments = attachments.filter(
        (att) => att.contentType === 'application/pdf' || att.url?.toLowerCase().endsWith('.pdf')
      );

      if (pdfAttachments.length === 0) {
        return message;
      }

      const nonPdfAttachments = attachments.filter(
        (att) => att.contentType !== 'application/pdf' && !att.url?.toLowerCase().endsWith('.pdf')
      );

      const ocrResults = await Promise.all(
        pdfAttachments.map(async (pdf) => {
          try {
            console.log(`🔄 Processing PDF: ${pdf.name}`);
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
      
      if (successfulExtractions.length > 0) {
        const pdfContentBlock = successfulExtractions
          .map((extraction) => {
            if (extraction.success) {
              return `\n\n📄 **Contenu du fichier PDF "${extraction.fileName}"** (${extraction.pages} page(s), ${extraction.tablesCount} tableau(x)):\n\n${extraction.text}`;
            }
            return '';
          })
          .join('\n');

        const updatedParts = message.parts.map((part: any) => {
          if (part.type === 'text') {
            return {
              ...part,
              text: part.text + pdfContentBlock,
            };
          }
          return part;
        });

        const hasTextPart = message.parts.some((p: any) => p.type === 'text');
        if (!hasTextPart && pdfContentBlock) {
          updatedParts.push({
            type: 'text',
            text: pdfContentBlock.trim(),
          });
        }

        return {
          ...message,
          parts: updatedParts,
          experimental_attachments: nonPdfAttachments.length > 0 ? nonPdfAttachments : undefined,
        };
      }

      return {
        ...message,
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
    const attachments = message.experimental_attachments;
    if (!attachments || attachments.length === 0) return false;
    
    return attachments.some(
      (att: any) => att.contentType === 'application/pdf' || att.url?.toLowerCase().endsWith('.pdf')
    );
  });
}
