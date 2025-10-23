'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import DataAnalysisResult from '@/components/data-analysis-result';
import { generatePDFReport, generateDOCXReport, generateExcelReport } from '@/lib/report-generator';

interface UploadResponse {
  success: boolean;
  file_name: string;
  file_size: number;
  format: string;
  data: string;
  columns: string[];
  preview: Record<string, any>[];
  row_count: number;
}

interface AnalysisResult {
  row_count: number;
  column_count: number;
  numeric_columns: string[];
  categorical_columns: string[];
  numeric_stats: Record<string, any>;
  categorical_stats: Record<string, any>;
  missing_analysis: any;
  correlation: any;
  charts: any[];
  insights: string[];
  recommendations: string[];
}

export default function DataAnalyzerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls', '.pdf'];
    const validMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
    ];

    const fileName = file.name.toLowerCase();
    const hasValidExtension = validTypes.some(ext => fileName.endsWith(ext));
    const hasValidMime = validMimeTypes.includes(file.type);

    if (!hasValidExtension && !hasValidMime) {
      setError('Invalid file type. Please upload a CSV, Excel (XLS/XLSX), or PDF file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50MB.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data: UploadResponse = await response.json();
      setUploadedData(data);
      toast.success(`${data.file_name} uploaded successfully (${data.row_count} rows)`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedData) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Call the API to analyze the data
      const response = await fetch('/api/analyze-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_content: uploadedData.data,
          file_name: uploadedData.file_name,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze data');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
      toast.success('Data analysis completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async (format: 'pdf' | 'docx' | 'xlsx') => {
    if (!analysisResult) return;

    setIsGeneratingReport(true);
    try {
      let blob: Blob;
      let fileName: string;

      const baseFileName = uploadedData?.file_name?.replace(/\.[^/.]+$/, '') || 'analysis_report';

      switch (format) {
        case 'pdf':
          blob = await generatePDFReport(
            uploadedData?.file_name || 'data',
            analysisResult
          );
          fileName = `${baseFileName}_report.pdf`;
          break;
        case 'docx':
          blob = await generateDOCXReport(
            uploadedData?.file_name || 'data',
            analysisResult
          );
          fileName = `${baseFileName}_report.docx`;
          break;
        case 'xlsx':
          blob = await generateExcelReport(
            uploadedData?.file_name || 'data',
            analysisResult
          );
          fileName = `${baseFileName}_report.xlsx`;
          break;
      }

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success(`${format.toUpperCase()} report downloaded successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(`Report generation failed: ${errorMessage}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Data Analyzer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload your data and get comprehensive analysis with charts and insights
            </p>
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-2 border-dashed border-blue-300 dark:border-blue-800">
            <CardHeader>
              <CardTitle>Upload Your Data</CardTitle>
              <CardDescription>
                Supported formats: CSV, Excel (XLS/XLSX), PDF (Max 50MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-blue-300 dark:border-blue-800 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <p className="text-lg font-semibold mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  CSV, Excel, or PDF files are supported
                </p>
              </div>

              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />

              {uploadedData && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{uploadedData.file_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {uploadedData.row_count} rows • {uploadedData.columns.length} columns
                    </p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center gap-2 p-3">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Analyze Button */}
        {uploadedData && !analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Data...
                </>
              ) : (
                'Analyze Data'
              )}
            </Button>
          </motion.div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DataAnalysisResult
              data={analysisResult}
              fileName={uploadedData?.file_name || 'data'}
              onGenerateReport={() => {
                // Show format selection
                const format = prompt('Select report format (pdf/docx/xlsx):', 'pdf');
                if (format === 'pdf' || format === 'docx' || format === 'xlsx') {
                  handleGenerateReport(format);
                }
              }}
            />

            {/* Download Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 grid grid-cols-3 gap-4"
            >
              <Button
                onClick={() => handleGenerateReport('pdf')}
                disabled={isGeneratingReport}
                variant="outline"
                className="w-full"
              >
                {isGeneratingReport ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Download PDF
              </Button>
              <Button
                onClick={() => handleGenerateReport('docx')}
                disabled={isGeneratingReport}
                variant="outline"
                className="w-full"
              >
                {isGeneratingReport ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Download DOCX
              </Button>
              <Button
                onClick={() => handleGenerateReport('xlsx')}
                disabled={isGeneratingReport}
                variant="outline"
                className="w-full"
              >
                {isGeneratingReport ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Download XLSX
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
