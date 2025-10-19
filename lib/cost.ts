export const COST_PER_TOKEN = 0.001;

export function tokensToUsd(totalTokens?: number | null, inputTokens?: number | null, outputTokens?: number | null) {
  const total = (totalTokens ?? 0) || ((inputTokens ?? 0) + (outputTokens ?? 0));
  return total * COST_PER_TOKEN;
}
