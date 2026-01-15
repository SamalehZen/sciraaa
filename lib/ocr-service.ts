const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'https://hyper-ocr-service.onrender.com';

export interface OCRResult {
  success: boolean;
  text: string;
  markdown: string;
  tables: Array<{
    markdown: string;
    html: string;
  }>;
  pages: number;
  error?: string;
}

export async function extractTextFromPDF(fileUrl: string, language: string = 'fr'): Promise<OCRResult> {
  try {
    const response = await fetch(`${OCR_SERVICE_URL}/ocr/extract-from-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: fileUrl, language }),
    });

    if (!response.ok) {
      throw new Error(`OCR service error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'OCR extraction failed');
    }

    return {
      success: true,
      text: result.raw_text,
      markdown: result.markdown_output,
      tables: result.tables.map((t: any) => ({
        markdown: t.markdown,
        html: t.html,
      })),
      pages: result.pages,
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    return {
      success: false,
      text: '',
      markdown: '',
      tables: [],
      pages: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function extractTextFromFile(file: File, language: string = 'fr'): Promise<OCRResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    const response = await fetch(`${OCR_SERVICE_URL}/ocr/extract-structured`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR service error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'OCR extraction failed');
    }

    return {
      success: true,
      text: result.raw_text,
      markdown: result.markdown_output,
      tables: result.tables.map((t: any) => ({
        markdown: t.markdown,
        html: t.html,
      })),
      pages: result.pages,
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    return {
      success: false,
      text: '',
      markdown: '',
      tables: [],
      pages: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkOCRServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OCR_SERVICE_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
