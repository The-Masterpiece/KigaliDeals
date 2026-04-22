import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Claude pricing per million tokens (as of April 2026).
// Update these if pricing changes.
const PRICING = {
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
};

export function calcCost(model, inputTokens, outputTokens) {
  const p = PRICING[model];
  if (!p) return null;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}

// Default model for most agent work. Use Haiku for cheap classification tasks.
export const DEFAULT_MODEL = "claude-sonnet-4-5";
export const CHEAP_MODEL = "claude-haiku-4-5";
