/**
 * Listado de modelos disponibles por proveedor (Ollama, OpenAI-compatible, Google, etc.).
 */

import type { ProviderProfile } from '../types';
import { ProviderRequestError } from '../lib/providers/provider-errors';

export type ProviderModelsSource = 'fetched' | 'fallback';

export interface ProviderModelsResult {
  models: string[];
  source: ProviderModelsSource;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function uniqueSorted(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

async function fetchOllamaModels(baseURL: string): Promise<string[]> {
  const base = trimSlash(baseURL);
  const res = await fetch(`${base}/api/tags`);
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new ProviderRequestError(errText || res.statusText, res.status, errText);
  }
  const json = (await res.json()) as { models?: Array<{ name?: string }> };
  const names = (json.models ?? []).map((m) => m.name).filter((n): n is string => Boolean(n));
  return uniqueSorted(names);
}

async function fetchOpenAiCompatibleModels(profile: ProviderProfile): Promise<string[]> {
  const base = trimSlash(profile.baseURL);
  const res = await fetch(`${base}/models`, {
    headers: {
      ...(profile.apiKey ? { Authorization: `Bearer ${profile.apiKey}` } : {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new ProviderRequestError(errText || res.statusText, res.status, errText);
  }
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  const ids = (json.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
  return uniqueSorted(ids);
}

async function fetchGoogleModels(profile: ProviderProfile): Promise<string[]> {
  const base = trimSlash(profile.baseURL);
  const url = `${base}/models?key=${encodeURIComponent(profile.apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new ProviderRequestError(errText || res.statusText, res.status, errText);
  }
  const json = (await res.json()) as {
    models?: Array<{
      name?: string;
      supportedGenerationMethods?: string[];
    }>;
  };
  const ids = (json.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => {
      const name = m.name ?? '';
      return name.startsWith('models/') ? name.slice('models/'.length) : name;
    })
    .filter(Boolean);
  return uniqueSorted(ids);
}

/**
 * Obtiene la lista de modelos del proveedor según su protocolo.
 * Anthropic no expone listado público fiable: devuelve manualModels como fallback.
 */
export async function fetchProviderModels(profile: ProviderProfile): Promise<ProviderModelsResult> {
  const { protocol } = profile;

  if (protocol === 'anthropic') {
    return {
      models: uniqueSorted(profile.manualModels),
      source: 'fallback',
    };
  }

  let models: string[];

  switch (protocol) {
    case 'ollama':
      models = await fetchOllamaModels(profile.baseURL);
      break;
    case 'openai':
    case 'openai-compatible':
      models = await fetchOpenAiCompatibleModels(profile);
      break;
    case 'google':
      models = await fetchGoogleModels(profile);
      break;
    default:
      throw new ProviderRequestError(`Unsupported protocol: ${protocol}`);
  }

  if (models.length === 0) {
    throw new ProviderRequestError('No models found on provider');
  }

  return { models, source: 'fetched' };
}
