import type { Channel } from "./channels";

export type IntegrationProvider = "meta" | "smartly" | "google_ads" | "dv360";

export interface LlmCredentials {
  apiKey: string;
  /** e.g. gpt-4o-mini, gpt-4o */
  model?: string;
  /** Default tone / direction applied to every generation */
  brandVoice?: string;
}

export interface MetaCredentials {
  accessToken: string;
  adAccountId: string;
}

export interface SmartlyCredentials {
  apiKey: string;
  companyId?: string;
}

export interface GoogleAdsCredentials {
  developerToken: string;
  customerId: string;
  refreshToken?: string;
}

export interface Dv360Credentials {
  partnerId: string;
  advertiserId: string;
}

export interface IntegrationConfig {
  llm?: LlmCredentials;
  meta?: MetaCredentials;
  smartly?: SmartlyCredentials;
  google_ads?: GoogleAdsCredentials;
  dv360?: Dv360Credentials;
}

const STORAGE_KEY = "signal-ads-integrations";

export function loadIntegrations(): IntegrationConfig {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IntegrationConfig) : {};
  } catch {
    return {};
  }
}

export function saveIntegrations(config: IntegrationConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearIntegrations(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isLlmConfigured(config: IntegrationConfig): boolean {
  return Boolean(config.llm?.apiKey?.trim());
}

export function isProviderConfigured(
  config: IntegrationConfig,
  provider: IntegrationProvider
): boolean {
  switch (provider) {
    case "meta":
      return Boolean(config.meta?.accessToken && config.meta?.adAccountId);
    case "smartly":
      return Boolean(config.smartly?.apiKey);
    case "google_ads":
      return Boolean(
        config.google_ads?.developerToken && config.google_ads?.customerId
      );
    case "dv360":
      return Boolean(config.dv360?.partnerId && config.dv360?.advertiserId);
    default:
      return false;
  }
}

export function channelProvider(channel: Channel): IntegrationProvider {
  switch (channel) {
    case "meta":
      return "meta";
    case "smartly":
      return "smartly";
    case "google_search":
      return "google_ads";
    case "display":
      return "dv360";
  }
}

export function hasLiveCredentials(
  config: IntegrationConfig,
  channel: Channel
): boolean {
  return isProviderConfigured(config, channelProvider(channel));
}

export const LLM_FIELDS = {
  label: "AI creative generation",
  description:
    "Your OpenAI key powers live ideation and customized creatives. Stored in your browser only.",
  fields: [
    {
      key: "apiKey",
      label: "OpenAI API Key",
      placeholder: "sk-...",
      secret: true,
    },
    {
      key: "model",
      label: "Model",
      placeholder: "gpt-4o-mini",
    },
    {
      key: "brandVoice",
      label: "Default brand voice / direction",
      placeholder: "e.g. Playful, urban, Gen Z — emphasize convenience and new-user promos",
      multiline: true,
    },
  ],
} as const;

export const INTEGRATION_FIELDS: Record<
  IntegrationProvider,
  { label: string; fields: { key: string; label: string; placeholder: string; secret?: boolean }[] }
> = {
  meta: {
    label: "Meta Marketing API",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "EAAxxxx...", secret: true },
      { key: "adAccountId", label: "Ad Account ID", placeholder: "act_123456789" },
    ],
  },
  smartly: {
    label: "Smartly.io",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "sk_live_...", secret: true },
      { key: "companyId", label: "Company ID (optional)", placeholder: "company_abc" },
    ],
  },
  google_ads: {
    label: "Google Ads API",
    fields: [
      { key: "developerToken", label: "Developer Token", placeholder: "xxxx", secret: true },
      { key: "customerId", label: "Customer ID", placeholder: "123-456-7890" },
      { key: "refreshToken", label: "Refresh Token (optional)", placeholder: "1//...", secret: true },
    ],
  },
  dv360: {
    label: "DV360 / Display & Video 360",
    fields: [
      { key: "partnerId", label: "Partner ID", placeholder: "123456" },
      { key: "advertiserId", label: "Advertiser ID", placeholder: "789012" },
    ],
  },
};
