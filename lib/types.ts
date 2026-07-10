import type { Channel } from "./channels";
import type { ChannelPayload } from "./creative/channel-payload";

export type SignalType = "weather" | "traffic" | "trends" | "social" | "reddit";
export type Market =
  | "NYC"
  | "LAX"
  | "ORD"
  | "SEA"
  | "SFO"
  | "MIA"
  | "BOS"
  | "AUS"
  | "ATL"
  | "DFW"
  | "US";
export type PipelineStage =
  | "detect"
  | "generate"
  | "validate"
  | "launch"
  | "optimize";
export type CampaignStatus =
  | "pending_approval"
  | "active"
  | "paused"
  | "scaled"
  | "blocked";
export type { Channel } from "./channels";
export type { ChannelPayload } from "./creative/channel-payload";
export type Platform = "meta" | "smartly" | "google_search" | "display";

export interface SignalPayload {
  summary: string;
  sourceUrl?: string;
  sourceLabel?: string;
  sourceType?: "api" | "mock" | "injected" | "reddit" | "trends";
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Signal {
  id: string;
  type: SignalType;
  market: Market;
  severity: "low" | "medium" | "high";
  payload: SignalPayload;
  detectedAt: string;
}

export interface SocialSignal {
  platform: string;
  topic: string;
  snippet: string;
  engagementScore: number;
  velocity: number;
  url: string;
  market: Market;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface Trigger {
  id: string;
  signalId: string;
  type: SignalType;
  market: Market;
  rule: string;
  firedAt: string;
}

export interface CreativeVariant {
  id: string;
  triggerId: string;
  signalId?: string;
  channel: Channel;
  persona: string;
  market: Market;
  headline: string;
  copy: string;
  description?: string;
  cta: string;
  imagePrompt: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
  signalContext: string;
  signalSummary?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  productOffer?: string;
  visualTreatment?: string;
  specLabel?: string;
  channelPayload?: ChannelPayload;
  attribution: string;
  complianceStatus: "pending" | "passed" | "blocked" | "fixed" | "pending_review" | "approved" | "published";
  createdAt: string;
}

export interface ComplianceResult {
  passed: boolean;
  violations: string[];
  autoFixes: string[];
  fixedCopy?: string;
  fixedHeadline?: string;
}

export interface Campaign {
  id: string;
  creativeId: string;
  triggerId: string;
  platform: Platform;
  channel: Channel;
  platformId: string;
  status: CampaignStatus;
  budget: number;
  targeting: string;
  market: Market;
  publishAdapter?: string;
  launchedAt?: string;
}

export interface PerformanceSnapshot {
  campaignId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpa: number;
  spend: number;
  recordedAt: string;
}

export interface PipelineRun {
  id: string;
  triggerId: string;
  stage: PipelineStage;
  status: "running" | "completed" | "failed" | "paused";
  startedAt: string;
  completedAt?: string;
  stageTimings: Partial<Record<PipelineStage, number>>;
}

export type EventType =
  | "signal_detected"
  | "trigger_fired"
  | "pipeline_stage"
  | "creative_generated"
  | "compliance_result"
  | "campaign_launched"
  | "campaign_approved"
  | "performance_update"
  | "optimizer_action"
  | "campaign_published"
  | "pipeline_paused"
  | "pipeline_resumed";

export interface AppEvent {
  id: string;
  type: EventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface DemoSettings {
  market: Market;
  activeMarkets: Market[];
  selectedChannels: Channel[];
  autoLaunch: boolean;
  pipelinePaused: boolean;
}
