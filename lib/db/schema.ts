import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const signals = sqliteTable("signals", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  market: text("market").notNull(),
  severity: text("severity").notNull(),
  payload: text("payload").notNull(),
  detectedAt: text("detected_at").notNull(),
});

export const triggers = sqliteTable("triggers", {
  id: text("id").primaryKey(),
  signalId: text("signal_id").notNull(),
  type: text("type").notNull(),
  market: text("market").notNull(),
  rule: text("rule").notNull(),
  firedAt: text("fired_at").notNull(),
});

export const creatives = sqliteTable("creatives", {
  id: text("id").primaryKey(),
  triggerId: text("trigger_id").notNull(),
  persona: text("persona").notNull(),
  market: text("market").notNull(),
  headline: text("headline").notNull(),
  copy: text("copy").notNull(),
  cta: text("cta").notNull(),
  imagePrompt: text("image_prompt").notNull(),
  signalContext: text("signal_context").notNull(),
  attribution: text("attribution").notNull(),
  complianceStatus: text("compliance_status").notNull(),
  createdAt: text("created_at").notNull(),
  channel: text("channel"),
  imageUrl: text("image_url"),
  description: text("description"),
});

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  creativeId: text("creative_id").notNull(),
  triggerId: text("trigger_id").notNull(),
  platform: text("platform").notNull(),
  platformId: text("platform_id").notNull(),
  status: text("status").notNull(),
  budget: real("budget").notNull(),
  targeting: text("targeting").notNull(),
  market: text("market").notNull(),
  launchedAt: text("launched_at"),
  channel: text("channel"),
  publishAdapter: text("publish_adapter"),
});

export const performance = sqliteTable("performance", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  impressions: integer("impressions").notNull(),
  clicks: integer("clicks").notNull(),
  ctr: real("ctr").notNull(),
  cpa: real("cpa").notNull(),
  spend: real("spend").notNull(),
  recordedAt: text("recorded_at").notNull(),
});

export const pipelineRuns = sqliteTable("pipeline_runs", {
  id: text("id").primaryKey(),
  triggerId: text("trigger_id").notNull(),
  stage: text("stage").notNull(),
  status: text("status").notNull(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  stageTimings: text("stage_timings").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
