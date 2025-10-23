import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { scira } from '@/ai/providers';
import { Daytona } from '@daytonaio/sdk';
import { serverEnv } from '@/env/server';
import { SNAPSHOT_NAME } from '@/lib/constants';

const daytona = new Daytona({
  apiKey: serverEnv.DAYTONA_API_KEY,
  target: 'us',
});

const pythonLibsAvailable = [
  'pandas',
  'numpy',
  'scipy',
  'keras',
  'seaborn',
  'matplotlib',
  'transformers',
  'scikit-learn',
];

const runPythonAnalysis = async (csvContent: string): Promise<any> => {
  const pythonCode = `
import pandas as pd
import numpy as np
import json
from io import StringIO
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Read CSV
csv_data = """${csvContent.replace(/"/g, '\\"')}"""
try:
    df = pd.read_csv(StringIO(csv_data))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    exit(1)

# Auto-detect columns info
columns_info = {}
for col in df.columns:
    dtype = str(df[col].dtype)
    columns_info[col] = {
        "type": dtype,
        "non_null": int(df[col].notna().sum()),
        "null_count": int(df[col].isna().sum()),
        "unique": int(df[col].nunique())
    }

# Basic statistics
stats = {
    "row_count": len(df),
    "column_count": len(df.columns),
    "memory_usage": str(df.memory_usage().sum()),
    "columns": list(df.columns),
    "dtypes": df.dtypes.astype(str).to_dict(),
}

# Numeric columns analysis
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
numeric_stats = {}
for col in numeric_cols:
    numeric_stats[col] = {
        "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else 0,
        "median": float(df[col].median()) if not pd.isna(df[col].median()) else 0,
        "std": float(df[col].std()) if not pd.isna(df[col].std()) else 0,
        "min": float(df[col].min()) if not pd.isna(df[col].min()) else 0,
        "max": float(df[col].max()) if not pd.isna(df[col].max()) else 0,
        "q25": float(df[col].quantile(0.25)) if not pd.isna(df[col].quantile(0.25)) else 0,
        "q75": float(df[col].quantile(0.75)) if not pd.isna(df[col].quantile(0.75)) else 0
    }

# Categorical analysis
categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
categorical_stats = {}
for col in categorical_cols[:5]:
    top_vals = df[col].value_counts().head(10).to_dict()
    categorical_stats[col] = {str(k): int(v) for k, v in top_vals.items()}

# Missing data analysis
missing_analysis = {
    "total_missing": int(df.isna().sum().sum()),
    "missing_by_column": {str(k): int(v) for k, v in df.isna().sum().items()},
    "missing_percentage": {str(k): float(v) for k, v in (df.isna().sum() / len(df) * 100).items()}
}

# Correlation analysis for numeric columns
correlation = {"strong_correlations": []}
if len(numeric_cols) > 1:
    corr_matrix = df[numeric_cols].corr()
    for i in range(len(corr_matrix.columns)):
        for j in range(i+1, len(corr_matrix.columns)):
            if abs(corr_matrix.iloc[i, j]) > 0.5:
                correlation["strong_correlations"].append({
                    "col1": str(corr_matrix.columns[i]),
                    "col2": str(corr_matrix.columns[j]),
                    "correlation": float(corr_matrix.iloc[i, j])
                })

# Compile results
result = {
    "row_count": stats["row_count"],
    "column_count": stats["column_count"],
    "numeric_columns": numeric_cols,
    "categorical_columns": categorical_cols,
    "numeric_stats": numeric_stats,
    "categorical_stats": categorical_stats,
    "missing_analysis": missing_analysis,
    "correlation": correlation,
    "charts": []
}

print(json.dumps(result))
`;

  const sandbox = await daytona.create({
    snapshot: SNAPSHOT_NAME,
  });

  try {
    const result = await sandbox.process.codeRun(pythonCode);
    await sandbox.delete();

    try {
      return JSON.parse(result.result);
    } catch (e) {
      console.error('Error parsing analysis result:', e);
      return {
        row_count: 0,
        column_count: 0,
        numeric_columns: [],
        categorical_columns: [],
        numeric_stats: {},
        categorical_stats: {},
        missing_analysis: {},
        correlation: { strong_correlations: [] },
        charts: [],
      };
    }
  } catch (error) {
    await sandbox.delete();
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const schema = z.object({
      file_content: z.string(),
      file_name: z.string(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { file_content, file_name } = parsed.data;

    // Run Python analysis
    const analysisData = await runPythonAnalysis(file_content);

    // Generate insights using AI
    const insightsPrompt = `Based on this data analysis, provide 3-5 key insights:

Row Count: ${analysisData.row_count}
Column Count: ${analysisData.column_count}
Numeric Columns: ${analysisData.numeric_columns.join(', ')}
Categorical Columns: ${analysisData.categorical_columns.join(', ')}
Missing Data: ${analysisData.missing_analysis.total_missing} total missing values
Strong Correlations: ${analysisData.correlation.strong_correlations.length > 0 ? JSON.stringify(analysisData.correlation.strong_correlations) : 'None'}

Provide concise, actionable insights as bullet points.`;

    const { object: insightsObj } = await generateObject({
      model: scira.languageModel('scira-google-think'),
      schema: z.object({
        insights: z.array(z.string()),
      }),
      prompt: insightsPrompt,
    });

    // Generate recommendations using AI
    const recsPrompt = `Based on this data analysis result, what are 3-5 actionable recommendations?

${JSON.stringify(analysisData, null, 2)}

Provide practical recommendations for data improvement or analysis next steps.`;

    const { object: recsObj } = await generateObject({
      model: scira.languageModel('scira-google-think'),
      schema: z.object({
        recommendations: z.array(z.string()),
      }),
      prompt: recsPrompt,
    });

    const finalResult = {
      ...analysisData,
      insights: insightsObj.insights,
      recommendations: recsObj.recommendations,
    };

    return NextResponse.json({
      success: true,
      analysis: finalResult,
      file_name,
    });
  } catch (error) {
    console.error('Error analyzing data:', error);
    return NextResponse.json(
      { error: `Failed to analyze data: ${String(error)}` },
      { status: 500 }
    );
  }
}
