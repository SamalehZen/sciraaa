import pdf from 'pdf-parse';

export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(pdfBuffer);
    return data.text.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextFromPdfUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return extractTextFromPdf(buffer);
  } catch (error) {
    console.error('Error extracting text from PDF URL:', error);
    throw new Error('Failed to extract text from PDF URL');
  }
}

export function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
}

export function isPdfContentType(contentType: string): boolean {
  return contentType === 'application/pdf';
}
