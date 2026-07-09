/**
 * Perfiles de proveedor IA (adaptado de Morphic, solo cliente).
 */

import type { ProviderProfile, ProviderProtocol } from '../../types';

export type { ProviderProfile, ProviderProtocol };
export type ProviderConnectionStatus = 'online' | 'disconnected';

export interface ProviderPreset {
  id: string;
  label: string;
  protocol: ProviderProtocol;
  defaultBaseURL: string;
  defaultModel: string;
}

export const BUILTIN_PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'openai', label: 'OpenAI', protocol: 'openai', defaultBaseURL: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  { id: 'anthropic', label: 'Anthropic', protocol: 'anthropic', defaultBaseURL: 'https://api.anthropic.com', defaultModel: 'claude-3-5-haiku-latest' },
  { id: 'google', label: 'Google Gemini', protocol: 'google', defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.0-flash' },
  { id: 'groq', label: 'Groq', protocol: 'openai-compatible', defaultBaseURL: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'openrouter', label: 'OpenRouter', protocol: 'openai-compatible', defaultBaseURL: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini' },
  { id: 'deepseek', label: 'DeepSeek', protocol: 'openai-compatible', defaultBaseURL: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  { id: 'mistral', label: 'Mistral', protocol: 'openai-compatible', defaultBaseURL: 'https://api.mistral.ai/v1', defaultModel: 'mistral-small-latest' },
  { id: 'lmstudio', label: 'LM Studio (local)', protocol: 'openai-compatible', defaultBaseURL: 'http://127.0.0.1:1234/v1', defaultModel: 'local-model' },
  { id: 'ollama-local', label: 'Ollama (local)', protocol: 'ollama', defaultBaseURL: 'http://127.0.0.1:11434', defaultModel: 'llama3.2' },
];

const PRESET_BY_ID = new Map(BUILTIN_PROVIDER_PRESETS.map((p) => [p.id, p]));

export function getPreset(id: string): ProviderPreset | undefined {
  return PRESET_BY_ID.get(id);
}

export function isBuiltinId(id: string): boolean {
  return PRESET_BY_ID.has(id);
}

export function profileFromPreset(preset: ProviderPreset): ProviderProfile {
  const isLocalPreset = preset.protocol === 'ollama' || preset.id === 'lmstudio';
  return {
    id: preset.id,
    label: preset.label,
    protocol: preset.protocol,
    baseURL: preset.defaultBaseURL,
    apiKey: '',
    enabled: false,
    builtin: true,
    defaultBaseURL: preset.defaultBaseURL,
    manualModels: isLocalPreset ? [] : [preset.defaultModel],
  };
}

export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••';
  return `${trimmed.slice(0, 3)}••••${trimmed.slice(-4)}`;
}

export function isLocalBaseURL(baseURL: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./.test(baseURL);
}

export function isProfileConfigured(profile: Pick<ProviderProfile, 'protocol' | 'baseURL' | 'apiKey'>): boolean {
  if (!profile.baseURL.trim() && profile.protocol !== 'openai' && profile.protocol !== 'anthropic') {
    return false;
  }
  const keyless = profile.protocol === 'ollama' || isLocalBaseURL(profile.baseURL);
  return keyless || profile.apiKey.trim().length > 0;
}

export function deriveStatus(
  profile: Pick<ProviderProfile, 'enabled' | 'protocol' | 'baseURL' | 'apiKey' | 'manualModels'>
): ProviderConnectionStatus {
  if (!profile.enabled) return 'disconnected';
  if (!isProfileConfigured(profile)) return 'disconnected';
  if ((profile.manualModels?.length ?? 0) > 0) return 'online';
  return 'disconnected';
}

export function createDefaultProfiles(): ProviderProfile[] {
  return BUILTIN_PROVIDER_PRESETS.map(profileFromPreset);
}
