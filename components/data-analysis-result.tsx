'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface DataAnalysisResultProps {
  data: AnalysisResult;
  fileName: string;
  onGenerateReport?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

export default function DataAnalysisResult({
  data,
  fileName,
  onGenerateReport,
}: DataAnalysisResultProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.row_count.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.column_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Numeric Cols</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.numeric_columns.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categorical Cols</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.categorical_columns.length}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="missing">Missing Data</TabsTrigger>
            <TabsTrigger value="correlation">Correlation</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            {data.numeric_columns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Numeric Columns Statistics</CardTitle>
                  <CardDescription>
                    Statistical summary of numeric columns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.numeric_columns.map((col) => {
                      const stats = data.numeric_stats[col];
                      return (
                        <div key={col} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3">{col}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Mean:</span>
                              <div className="font-semibold">{stats.mean.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Median:</span>
                              <div className="font-semibold">{stats.median.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Std Dev:</span>
                              <div className="font-semibold">{stats.std.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Range:</span>
                              <div className="font-semibold">{(stats.max - stats.min).toFixed(2)}</div>
                            </div>
                          </div>
                          {/* Simple Bar Chart */}
                          <div className="mt-3 h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: 'Min', value: stats.min },
                                { name: 'Q25', value: stats.q25 },
                                { name: 'Median', value: stats.median },
                                { name: 'Q75', value: stats.q75 },
                                { name: 'Max', value: stats.max },
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#0088FE" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.categorical_columns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Categorical Columns</CardTitle>
                  <CardDescription>
                    Top values in categorical columns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.categorical_columns.map((col) => {
                    const stats = data.categorical_stats[col];
                    if (!stats) return null;

                    const chartData = Object.entries(stats)
                      .slice(0, 5)
                      .map(([key, value]) => ({
                        name: key,
                        value: value as number,
                      }));

                    return (
                      <div key={col} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">{col}</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {chartData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Missing Data Tab */}
          <TabsContent value="missing">
            <Card>
              <CardHeader>
                <CardTitle>Missing Data Analysis</CardTitle>
                <CardDescription>
                  Total missing values: {data.missing_analysis.total_missing}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.missing_analysis.missing_by_column).map(([col, count]) => {
                    const percentage = data.missing_analysis.missing_percentage[col] || 0;
                    return (
                      <div key={col} className="flex items-center justify-between">
                        <span className="text-sm">{col}</span>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Correlation Tab */}
          <TabsContent value="correlation">
            <Card>
              <CardHeader>
                <CardTitle>Correlation Analysis</CardTitle>
                <CardDescription>
                  Strong correlations (|r| &gt; 0.5) found between columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.correlation.strong_correlations.length > 0 ? (
                  <div className="space-y-3">
                    {data.correlation.strong_correlations.map((corr: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{corr.col1} ↔ {corr.col2}</p>
                            <p className="text-xs text-muted-foreground">Correlation coefficient</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {corr.correlation.toFixed(3)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No strong correlations found between numeric columns.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>
                  AI-generated insights from your data analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Suggested next steps for your analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
