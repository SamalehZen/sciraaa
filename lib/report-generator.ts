import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import * as XLSX from 'xlsx';

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

export async function generatePDFReport(fileName: string, data: AnalysisResult): Promise<Blob> {
  const pdf = new jsPDF();
  let yPosition = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Title
  pdf.setFontSize(20);
  pdf.text('Data Analysis Report', margin, yPosition);
  yPosition += 10;

  // File info
  pdf.setFontSize(10);
  pdf.text(`File: ${fileName}`, margin, yPosition);
  yPosition += 5;
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 10;

  // Summary
  pdf.setFontSize(14);
  pdf.text('Summary', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  const summaryData = [
    `Total Rows: ${data.row_count.toLocaleString()}`,
    `Total Columns: ${data.column_count}`,
    `Numeric Columns: ${data.numeric_columns.length}`,
    `Categorical Columns: ${data.categorical_columns.length}`,
    `Missing Values: ${data.missing_analysis.total_missing}`,
  ];

  summaryData.forEach((line) => {
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 5;

  // Numeric Statistics
  if (data.numeric_columns.length > 0) {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.text('Numeric Statistics', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    data.numeric_columns.forEach((col) => {
      const stats = data.numeric_stats[col];
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(10);
      pdf.text(col, margin, yPosition);
      yPosition += 5;

      pdf.setFontSize(9);
      const statsLines = [
        `  Mean: ${stats.mean.toFixed(2)} | Median: ${stats.median.toFixed(2)}`,
        `  Std Dev: ${stats.std.toFixed(2)} | Range: ${(stats.max - stats.min).toFixed(2)}`,
        `  Min: ${stats.min.toFixed(2)} | Max: ${stats.max.toFixed(2)}`,
      ];

      statsLines.forEach((line) => {
        pdf.text(line, margin, yPosition);
        yPosition += 4;
      });
      yPosition += 3;
    });
  }

  // Missing Data
  if (yPosition > pageHeight - 40) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFontSize(14);
  pdf.text('Missing Data Analysis', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(9);
  Object.entries(data.missing_analysis.missing_by_column).forEach(([col, count]) => {
    const percentage = data.missing_analysis.missing_percentage[col] || 0;
    pdf.text(`${col}: ${count} (${percentage.toFixed(1)}%)`, margin, yPosition);
    yPosition += 4;
  });
  yPosition += 5;

  // Correlations
  if (data.correlation.strong_correlations.length > 0) {
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.text('Strong Correlations', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    data.correlation.strong_correlations.forEach((corr: any) => {
      pdf.text(`${corr.col1} ↔ ${corr.col2}: ${corr.correlation.toFixed(3)}`, margin, yPosition);
      yPosition += 4;
    });
    yPosition += 5;
  }

  // Insights
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFontSize(14);
  pdf.text('Key Insights', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(9);
  data.insights.forEach((insight) => {
    const lines = pdf.splitTextToSize(insight, maxWidth - 10);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, margin + 5, yPosition);
      yPosition += 4;
    });
    yPosition += 2;
  });

  // Recommendations
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFontSize(14);
  pdf.text('Recommendations', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(9);
  data.recommendations.forEach((rec) => {
    const lines = pdf.splitTextToSize(rec, maxWidth - 10);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, margin + 5, yPosition);
      yPosition += 4;
    });
    yPosition += 2;
  });

  return pdf.output('blob');
}

export async function generateDOCXReport(fileName: string, data: AnalysisResult): Promise<Blob> {
  const sections = [];

  // Title and metadata
  sections.push(
    new Paragraph({
      text: 'Data Analysis Report',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    })
  );

  sections.push(
    new Paragraph({
      text: `File: ${fileName}`,
      spacing: { before: 200, after: 100 },
    })
  );

  sections.push(
    new Paragraph({
      text: `Generated: ${new Date().toLocaleString()}`,
      spacing: { after: 200 },
    })
  );

  // Summary section
  sections.push(
    new Paragraph({
      text: 'Summary',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    })
  );

  const summaryData = [
    ['Metric', 'Value'],
    ['Total Rows', data.row_count.toLocaleString()],
    ['Total Columns', data.column_count.toString()],
    ['Numeric Columns', data.numeric_columns.length.toString()],
    ['Categorical Columns', data.categorical_columns.length.toString()],
    ['Missing Values', data.missing_analysis.total_missing.toString()],
  ];

  sections.push(
    new Table({
      rows: summaryData.map(
        (row, idx) =>
          new TableRow({
            cells: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph(cell)],
                  shading: idx === 0 ? { fill: 'CCCCCC' } : undefined,
                })
            ),
          })
      ),
      width: { size: 100, type: 'pct' },
    })
  );

  sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // Numeric Statistics
  if (data.numeric_columns.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Numeric Statistics',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    data.numeric_columns.forEach((col) => {
      const stats = data.numeric_stats[col];

      sections.push(
        new Paragraph({
          text: col,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        })
      );

      const statsTable = [
        ['Metric', 'Value'],
        ['Mean', stats.mean.toFixed(2)],
        ['Median', stats.median.toFixed(2)],
        ['Std Dev', stats.std.toFixed(2)],
        ['Min', stats.min.toFixed(2)],
        ['Max', stats.max.toFixed(2)],
        ['Q25', stats.q25.toFixed(2)],
        ['Q75', stats.q75.toFixed(2)],
      ];

      sections.push(
        new Table({
          rows: statsTable.map(
            (row, idx) =>
              new TableRow({
                cells: row.map(
                  (cell) =>
                    new TableCell({
                      children: [new Paragraph(cell)],
                      shading: idx === 0 ? { fill: 'CCCCCC' } : undefined,
                    })
                ),
              })
          ),
          width: { size: 100, type: 'pct' },
        })
      );

      sections.push(new Paragraph({ text: '', spacing: { after: 100 } }));
    });
  }

  // Insights
  sections.push(
    new Paragraph({
      text: 'Key Insights',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    })
  );

  data.insights.forEach((insight) => {
    sections.push(
      new Paragraph({
        text: insight,
        spacing: { before: 50, after: 50 },
      })
    );
  });

  // Recommendations
  sections.push(
    new Paragraph({
      text: 'Recommendations',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    })
  );

  data.recommendations.forEach((rec) => {
    sections.push(
      new Paragraph({
        text: rec,
        spacing: { before: 50, after: 50 },
      })
    );
  });

  const doc = new Document({ sections: [{ children: sections }] });
  const blob = await Packer.toBlob(doc);
  return blob;
}

export async function generateExcelReport(fileName: string, data: AnalysisResult): Promise<Blob> {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Data Analysis Report'],
    [`File: ${fileName}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    ['Metric', 'Value'],
    ['Total Rows', data.row_count],
    ['Total Columns', data.column_count],
    ['Numeric Columns', data.numeric_columns.length],
    ['Categorical Columns', data.categorical_columns.length],
    ['Missing Values', data.missing_analysis.total_missing],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Numeric Statistics sheet
  if (data.numeric_columns.length > 0) {
    const statsData: any[] = [['Column', 'Mean', 'Median', 'Std Dev', 'Min', 'Max', 'Q25', 'Q75']];

    data.numeric_columns.forEach((col) => {
      const stats = data.numeric_stats[col];
      statsData.push([
        col,
        stats.mean.toFixed(2),
        stats.median.toFixed(2),
        stats.std.toFixed(2),
        stats.min.toFixed(2),
        stats.max.toFixed(2),
        stats.q25.toFixed(2),
        stats.q75.toFixed(2),
      ]);
    });

    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Numeric Stats');
  }

  // Missing Data sheet
  const missingData = [['Column', 'Missing Count', 'Missing %']];
  Object.entries(data.missing_analysis.missing_by_column).forEach(([col, count]) => {
    const percentage = data.missing_analysis.missing_percentage[col] || 0;
    missingData.push([col, count, percentage.toFixed(1)]);
  });

  const missingSheet = XLSX.utils.aoa_to_sheet(missingData);
  XLSX.utils.book_append_sheet(workbook, missingSheet, 'Missing Data');

  // Correlations sheet
  if (data.correlation.strong_correlations.length > 0) {
    const corrData = [['Column 1', 'Column 2', 'Correlation']];
    data.correlation.strong_correlations.forEach((corr: any) => {
      corrData.push([corr.col1, corr.col2, corr.correlation.toFixed(3)]);
    });

    const corrSheet = XLSX.utils.aoa_to_sheet(corrData);
    XLSX.utils.book_append_sheet(workbook, corrSheet, 'Correlations');
  }

  // Insights sheet
  const insightsData = [['Key Insights'], ...data.insights.map((i) => [i])];
  const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
  XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Insights');

  // Recommendations sheet
  const recsData = [['Recommendations'], ...data.recommendations.map((r) => [r])];
  const recsSheet = XLSX.utils.aoa_to_sheet(recsData);
  XLSX.utils.book_append_sheet(workbook, recsSheet, 'Recommendations');

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
