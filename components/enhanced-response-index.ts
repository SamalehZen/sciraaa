/**
 * Enhanced Response - Central Export Point
 * 
 * This file exports all enhanced response-related components and utilities.
 * Import this file to get access to all enhanced response features.
 */

export { EnhancedResponse, type EnhancedResponseProps } from './enhanced-response';
export { EnhancedCodeBlock } from './enhanced-code-block';
export {
  SimpleResponseExample,
  CodeBlockExample,
  TableAndListExample,
  ComplexMarkdownExample,
  NonAnimatedResponseExample,
  MinimalResponseExample,
  CustomStyledResponseExample,
  StreamingResponseExample,
  ChatMessageIntegrationExample,
  FullFeaturedExample,
  EnhancedResponseShowcase,
} from './enhanced-response-examples';

/**
 * Configuration presets for different use cases
 */
export const EnhancedResponsePresets = {
  // Default: balanced features and animations
  default: {
    enableAnimations: true,
    enableInteractiveFeatures: true,
    parseIncompleteMarkdown: true,
  },

  // Streaming: optimized for real-time updates
  streaming: {
    enableAnimations: false,
    enableInteractiveFeatures: true,
    parseIncompleteMarkdown: true,
  },

  // Performance: minimal overhead
  performance: {
    enableAnimations: false,
    enableInteractiveFeatures: false,
    parseIncompleteMarkdown: false,
  },

  // Rich: all features enabled
  rich: {
    enableAnimations: true,
    enableInteractiveFeatures: true,
    parseIncompleteMarkdown: false,
  },

  // Minimal: read-only view
  minimal: {
    enableAnimations: false,
    enableInteractiveFeatures: false,
    parseIncompleteMarkdown: false,
  },

  // Animated: focus on animations
  animated: {
    enableAnimations: true,
    enableInteractiveFeatures: true,
    parseIncompleteMarkdown: true,
  },
} as const;

/**
 * Hook for selecting preset configuration
 */
export function useEnhancedResponsePreset(
  preset: keyof typeof EnhancedResponsePresets
) {
  return EnhancedResponsePresets[preset];
}

/**
 * Type definitions for presets
 */
export type EnhancedResponsePresetKey = keyof typeof EnhancedResponsePresets;

/**
 * Quick configuration helpers
 */
export const EnhancedResponseConfig = {
  /**
   * Get preset by use case
   */
  getPreset: (preset: EnhancedResponsePresetKey) => EnhancedResponsePresets[preset],

  /**
   * Merge custom config with preset
   */
  mergePreset: (
    preset: EnhancedResponsePresetKey,
    custom: Partial<typeof EnhancedResponsePresets.default>
  ) => ({
    ...EnhancedResponsePresets[preset],
    ...custom,
  }),

  /**
   * Get config for streaming state
   */
  getStreamingConfig: (isStreaming: boolean) =>
    isStreaming
      ? EnhancedResponsePresets.streaming
      : EnhancedResponsePresets.default,

  /**
   * Get config based on content size
   */
  getConfigForSize: (size: number) => {
    if (size > 100000) return EnhancedResponsePresets.performance;
    if (size > 50000) return EnhancedResponsePresets.streaming;
    return EnhancedResponsePresets.default;
  },
} as const;

/**
 * CSS Import helper (for completeness)
 * 
 * Usage in layout:
 * import '@/components/streaming-animations.css';
 */
export const STREAMING_ANIMATIONS_CSS = '@/components/streaming-animations.css';
