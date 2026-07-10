"use client";

import { useEffect, useState } from "react";
import {
  clearIntegrations,
  INTEGRATION_FIELDS,
  isLlmConfigured,
  isProviderConfigured,
  LLM_FIELDS,
  loadIntegrations,
  saveIntegrations,
  type IntegrationConfig,
  type IntegrationProvider,
  type LlmCredentials,
} from "@/lib/integrations";

interface IntegrationsPanelProps {
  open: boolean;
  onClose: () => void;
  onChange?: (config: IntegrationConfig) => void;
}

export function IntegrationsPanel({
  open,
  onClose,
  onChange,
}: IntegrationsPanelProps) {
  const [config, setConfig] = useState<IntegrationConfig>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setConfig(loadIntegrations());
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  const updateField = (
    provider: IntegrationProvider,
    key: string,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [provider]: {
        ...(prev[provider] as Record<string, string> | undefined),
        [key]: value,
      },
    }));
    setSaved(false);
  };

  const updateLlmField = (key: keyof LlmCredentials, value: string) => {
    setConfig((prev) => ({
      ...prev,
      llm: {
        ...(prev.llm ?? { apiKey: "" }),
        [key]: value,
      },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    saveIntegrations(config);
    onChange?.(config);
    setSaved(true);
  };

  const handleClear = () => {
    clearIntegrations();
    setConfig({});
    onChange?.({});
    setSaved(true);
  };

  const llmValues = config.llm ?? { apiKey: "" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-white shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[var(--border)] px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold">Integrations</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              AI keys for customized creatives · ad platform credentials for routing
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--muted)] hover:text-black text-xl leading-none px-2"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* LLM section */}
          <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-indigo-950">
                  ✨ {LLM_FIELDS.label}
                </h3>
                <p className="text-[11px] text-indigo-800/80 mt-0.5">
                  {LLM_FIELDS.description}
                </p>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  isLlmConfigured(config)
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-white text-zinc-500 border border-zinc-200"
                }`}
              >
                {isLlmConfigured(config) ? "Active" : "Not set"}
              </span>
            </div>
            {LLM_FIELDS.fields.map((field) => (
              <label key={field.key} className="block space-y-1">
                <span className="text-xs text-[var(--muted)]">{field.label}</span>
                {"multiline" in field && field.multiline ? (
                  <textarea
                    value={llmValues[field.key as keyof LlmCredentials] ?? ""}
                    onChange={(e) =>
                      updateLlmField(
                        field.key as keyof LlmCredentials,
                        e.target.value
                      )
                    }
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
                  />
                ) : (
                  <input
                    type={"secret" in field && field.secret ? "password" : "text"}
                    value={llmValues[field.key as keyof LlmCredentials] ?? ""}
                    onChange={(e) =>
                      updateLlmField(
                        field.key as keyof LlmCredentials,
                        e.target.value
                      )
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    autoComplete="off"
                  />
                )}
              </label>
            ))}
          </div>

          {/* Ad platforms */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
              Ad platform routing
            </h3>
            <div className="space-y-4">
              {(Object.keys(INTEGRATION_FIELDS) as IntegrationProvider[]).map(
                (provider) => {
                  const meta = INTEGRATION_FIELDS[provider];
                  const configured = isProviderConfigured(config, provider);
                  const values = (config[provider] ?? {}) as Record<string, string>;

                  return (
                    <div
                      key={provider}
                      className="rounded-xl border border-[var(--border)] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">{meta.label}</h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            configured
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {configured ? "Configured" : "Not set"}
                        </span>
                      </div>
                      {meta.fields.map((field) => (
                        <label key={field.key} className="block space-y-1">
                          <span className="text-xs text-[var(--muted)]">
                            {field.label}
                          </span>
                          <input
                            type={field.secret ? "password" : "text"}
                            value={values[field.key] ?? ""}
                            onChange={(e) =>
                              updateField(provider, field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--uber-green)]/30 focus:border-[var(--uber-green)]"
                            autoComplete="off"
                          />
                        </label>
                      ))}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <p className="text-[10px] text-[var(--muted)] leading-relaxed">
            All credentials stay in your browser (localStorage). Keys are sent to
            our server only when you generate or publish — never stored on our
            side. SignalScope AI demo · not affiliated with sample brands or ad
            platforms.
          </p>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[var(--border)] px-5 py-4 flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted)] hover:bg-zinc-50"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-black hover:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold transition-colors"
          >
            {saved ? "Saved ✓" : "Save credentials"}
          </button>
        </div>
      </div>
    </div>
  );
}
