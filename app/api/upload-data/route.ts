import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromHeaders } from '@/lib/local-session';
import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: 'File size should be 50MB or less',
    })
    .refine(
      (file) => {
        const t = file.type || '';
        const name = (file as any).name || '';
        const allowedTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf',
        ];
        const allowedExtensions = ['.csv', '.xls', '.xlsx', '.pdf'];
        
        const hasValidType = allowedTypes.includes(t);
        const hasValidExtension = allowedExtensions.some(ext => name.toLowerCase().endsWith(ext));
        
        return hasValidType || hasValidExtension;
      },
      {
        message: 'File type must be CSV, Excel (XLS/XLSX), or PDF',
      },
    ),
});

interface ParseResult {
  success: boolean;
  format: 'csv' | 'excel' | 'pdf' | 'unknown';
  data: string; // CSV format content
  columns: string[];
  preview: Record<string, any>[];
  rowCount: number;
  error?: string;
}

async function parseCSV(file: File): Promise<ParseResult> {
  const text = await file.text();
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const preview = lines.slice(1, 6).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, idx) => {
      obj[header] = values[idx]?.trim() || '';
      return obj;
    }, {} as Record<string, any>);
  });

  return {
    success: true,
    format: 'csv',
    data: text,
    columns: headers,
    preview,
    rowCount: lines.length - 1,
  };
}

async function parseExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to CSV format
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  // Get data as objects for preview
  const data = XLSX.utils.sheet_to_json(worksheet);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
  return {
    success: true,
    format: 'excel',
    data: csv,
    columns,
    preview: data.slice(0, 5),
    rowCount: data.length,
  };
}

async function parsePDF(file: File): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfParse(buffer);
    
    // Extract text and try to parse as table
    const text = pdf.text;
    
    // Try to detect if it's a table by looking for consistent patterns
    const lines = text.split('\n');
    const headers = lines[0]?.split(/\s{2,}/).filter(h => h.trim()) || ['Content'];
    
    // Create CSV format from extracted text
    let csv = headers.join(',') + '\n';
    for (let i = 1; i < Math.min(lines.length, 100); i++) {
      const line = lines[i].split(/\s{2,}/).join(',');
      if (line.trim()) csv += line + '\n';
    }
    
    return {
      success: true,
      format: 'pdf',
      data: csv,
      columns: headers,
      preview: [],
      rowCount: Math.min(lines.length - 1, 100),
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${String(error)}`);
  }
}

export async function POST(request: NextRequest) {
  let isAuthenticated = false;
  try {
    const sess = getSessionFromHeaders(request.headers as any);
    isAuthenticated = !!sess;
  } catch (error) {
    // Continue as unauthenticated
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Validate file
  const validatedFile = FileSchema.safeParse({ file });
  if (!validatedFile.success) {
    return NextResponse.json({ error: 'Invalid file type or size' }, { status: 400 });
  }

  try {
    const fileName = file.name.toLowerCase();
    let parseResult: ParseResult;

    if (fileName.endsWith('.csv') || file.type === 'text/csv') {
      parseResult = await parseCSV(file);
    } else if (
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    ) {
      parseResult = await parseExcel(file);
    } else if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      parseResult = await parsePDF(file);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      format: parseResult.format,
      data: parseResult.data,
      columns: parseResult.columns,
      preview: parseResult.preview,
      row_count: parseResult.rowCount,
      authenticated: isAuthenticated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: `Failed to process file: ${String(error)}` },
      { status: 500 }
    );
  }
}
