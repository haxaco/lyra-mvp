// apps/web/lib/ai/models.ts
import "server-only";

export type AIModel = {
  id: string;
  label: string;
  provider: "openai" | "anthropic" | "google" | "mistral";
  apiModel: string;
  defaultTemperature: number;
  supportsJson: boolean;
  purpose: string;
  enabled: boolean;
};

const bool = (v?: string) => String(v ?? "").toLowerCase() === "true";

const OPENAI: AIModel[] = [
  { 
    id: "gpt-4o-mini", 
    label: "OpenAI GPT-4o Mini", 
    provider: "openai", 
    apiModel: "gpt-4o-mini", 
    defaultTemperature: 0.4, 
    supportsJson: true, 
    purpose: "fast JSON reasoning", 
    enabled: true 
  },
  { 
    id: "gpt-4o", 
    label: "OpenAI GPT-4o", 
    provider: "openai", 
    apiModel: "gpt-4o", 
    defaultTemperature: 0.6, 
    supportsJson: true, 
    purpose: "higher fidelity", 
    enabled: true 
  },
];

const ANTHROPIC: AIModel[] = [
  { 
    id: "claude-3-5-sonnet", 
    label: "Claude 3.5 Sonnet", 
    provider: "anthropic", 
    apiModel: "claude-3-5-sonnet-latest", 
    defaultTemperature: 0.5, 
    supportsJson: true, 
    purpose: "planning/long prompts", 
    enabled: bool(process.env.ENABLE_PROVIDER_ANTHROPIC) 
  },
];

const GEMINI: AIModel[] = [
  { 
    id: "gemini-1.5-pro", 
    label: "Gemini 1.5 Pro", 
    provider: "google", 
    apiModel: "gemini-1.5-pro", 
    defaultTemperature: 0.5, 
    supportsJson: true, 
    purpose: "broad context", 
    enabled: bool(process.env.ENABLE_PROVIDER_GEMINI) 
  },
];

const MISTRAL: AIModel[] = [
  { 
    id: "mistral-large-latest", 
    label: "Mistral Large", 
    provider: "mistral", 
    apiModel: "mistral-large-latest", 
    defaultTemperature: 0.4, 
    supportsJson: true, 
    purpose: "cost/latency tradeoff", 
    enabled: bool(process.env.ENABLE_PROVIDER_MISTRAL) 
  },
];

export const ALL_MODELS: AIModel[] = [...OPENAI, ...ANTHROPIC, ...GEMINI, ...MISTRAL].filter(m => m.enabled);
export const DEFAULT_MODEL_ID = process.env.DEFAULT_AI_MODEL || "gpt-4o-mini";

export function resolveModel(id?: string): AIModel {
  const all = ALL_MODELS.length ? ALL_MODELS : OPENAI; // fallback
  const found = all.find(m => m.id === (id || DEFAULT_MODEL_ID)) || all[0];
  return found;
}
