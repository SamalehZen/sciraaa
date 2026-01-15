import { tool } from 'ai';
import { z } from 'zod';

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'https://hyper-ocr-service.onrender.com';

interface OCRServiceResponse {
  success: boolean;
  raw_text: string;
  tables: Array<{
    html: string;
    markdown: string;
  }>;
  markdown_output: string;
  pages: number;
  error?: string;
}

export const pdfOcrTool = tool({
  description: 'Extrait le texte et les tableaux d\'un fichier PDF ou image en utilisant l\'OCR avancé (PP-StructureV3). Utilise cet outil pour tous les documents PDF uploadés.',
  parameters: z.object({
    fileUrl: z.string().describe('URL du fichier PDF ou image à analyser'),
    language: z.string().default('fr').describe('Langue du document (fr, en, etc.)'),
  }),
  execute: async ({ fileUrl, language }) => {
    try {
      const response = await fetch(`${OCR_SERVICE_URL}/ocr/extract-from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl, language }),
      });

      if (!response.ok) {
        throw new Error(`OCR service error: ${response.status}`);
      }

      const result: OCRServiceResponse = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Extraction OCR échouée',
          text: '',
          tables: [],
          markdown: '',
          pages: 0,
        };
      }

      const tablesMarkdown = result.tables
        .map((t, i) => `### Tableau ${i + 1}\n${t.markdown}`)
        .join('\n\n');

      return {
        success: true,
        text: result.raw_text,
        tables: result.tables.map((t) => t.markdown),
        markdown: result.markdown_output,
        pages: result.pages,
        summary: `✅ OCR terminé: ${result.pages} page(s) analysée(s), ${result.tables.length} tableau(x) détecté(s)`,
      };
    } catch (error) {
      console.error('PDF OCR Tool error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        text: '',
        tables: [],
        markdown: '',
        pages: 0,
      };
    }
  },
});

export const ocrHealthCheckTool = tool({
  description: 'Vérifie si le service OCR est disponible',
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch(`${OCR_SERVICE_URL}/health`);
      const data = await response.json();
      return {
        available: response.ok,
        service: data,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Service indisponible',
      };
    }
  },
});
