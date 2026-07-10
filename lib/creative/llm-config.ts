import { config } from "../config";
import type { LlmCredentials } from "../integrations";

export interface LlmRunOptions {
  apiKey?: string;
  model?: string;
  customBrief?: string;
  brandVoice?: string;
}

export function llmFromCredentials(creds?: LlmCredentials): LlmRunOptions | undefined {
  if (!creds?.apiKey?.trim()) return undefined;
  return {
    apiKey: creds.apiKey.trim(),
    model: creds.model?.trim() || "gpt-4o-mini",
    brandVoice: creds.brandVoice?.trim(),
  };
}

export function resolveLlm(options?: LlmRunOptions): {
  apiKey: string | null;
  model: string;
  customBrief?: string;
  brandVoice?: string;
  source: "user" | "env" | "none";
} {
  const userKey = options?.apiKey?.trim();
  const envKey = config.openaiApiKey?.trim();
  const apiKey = userKey || envKey || null;

  return {
    apiKey,
    model: options?.model?.trim() || "gpt-4o-mini",
    customBrief: options?.customBrief?.trim(),
    brandVoice: options?.brandVoice?.trim(),
    source: userKey ? "user" : envKey ? "env" : "none",
  };
}

export function hasLlmKey(options?: LlmRunOptions): boolean {
  return resolveLlm(options).apiKey !== null;
}
