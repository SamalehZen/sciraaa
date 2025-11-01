import type { MermaidConfig } from 'mermaid';

const baseThemeVariables = {
  primaryColor: '#6366f1',
  primaryTextColor: '#ffffff',
  primaryBorderColor: '#4f46e5',
  secondaryColor: '#f1f5f9',
  secondaryTextColor: '#1e293b',
  secondaryBorderColor: '#cbd5e1',
  tertiaryColor: '#e2e8f0',
  tertiaryTextColor: '#334155',
  tertiaryBorderColor: '#94a3b8',
  lineColor: '#94a3b8',
  background: '#ffffff',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  fontSize: '14px',
} satisfies MermaidConfig['themeVariables'];

const flowchartConfig: NonNullable<MermaidConfig['flowchart']> = {
  curve: 'basis',
  padding: 15,
  nodeSpacing: 50,
  rankSpacing: 50,
  diagramPadding: 8,
  useMaxWidth: true,
};

const sequenceConfig: NonNullable<MermaidConfig['sequence']> = {
  diagramMarginX: 50,
  diagramMarginY: 10,
  actorMargin: 50,
  width: 150,
  height: 65,
  boxMargin: 10,
  boxTextMargin: 5,
  noteMargin: 10,
  messageMargin: 35,
  mirrorActors: true,
  useMaxWidth: true,
};

const ganttConfig: NonNullable<MermaidConfig['gantt']> = {
  titleTopMargin: 25,
  barHeight: 20,
  barGap: 4,
  topPadding: 50,
  leftPadding: 75,
  gridLineStartPadding: 35,
  fontSize: 11,
  sectionFontSize: 11,
  numberSectionStyles: 4,
  axisFormat: '%Y-%m-%d',
  useMaxWidth: true,
};

export const mermaidConfigLight: MermaidConfig = {
  startOnLoad: false,
  theme: 'default',
  themeVariables: baseThemeVariables,
  flowchart: flowchartConfig,
  sequence: sequenceConfig,
  gantt: ganttConfig,
};

export const mermaidConfigDark: MermaidConfig = {
  ...mermaidConfigLight,
  theme: 'dark',
  themeVariables: {
    ...baseThemeVariables,
    primaryColor: '#818cf8',
    primaryBorderColor: '#6366f1',
    secondaryColor: '#1e293b',
    secondaryTextColor: '#f1f5f9',
    secondaryBorderColor: '#475569',
    tertiaryColor: '#334155',
    tertiaryTextColor: '#cbd5e1',
    tertiaryBorderColor: '#64748b',
    lineColor: '#64748b',
    background: '#0f172a',
  },
};
