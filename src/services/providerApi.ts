/**
 * Llamadas directas a proveedores IA desde el navegador (local / compatible OpenAI).
 */

import type { ProviderProfile } from '../types';
import { ProviderRequestError } from '../lib/providers/provider-errors';

export interface ChatCompletionInput {
  profile: ProviderProfile;
  model: string;
  systemPrompt: string;
  userMessage: string;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

async function openAiCompatibleChat(input: ChatCompletionInput): Promise<string> {
  const base = trimSlash(input.profile.baseURL);
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(input.profile.apiKey ? { Authorization: `Bearer ${input.profile.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userMessage },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new ProviderRequestError(errText || res.statusText, res.status, errText);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new ProviderRequestError('Empty response from provider');
  return content;
}

async function anthropicChat(input: ChatCompletionInput): Promise<string> {
  const base = trimSlash(input.profile.baseURL);
  const res = await fetch(`${base}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': input.profile.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 2048,
      system: input.systemPrompt,
      messages: [{ role: 'user', content: input.userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new ProviderRequestError(errText || res.statusText, res.status, errText);
  }

  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = json.content?.find((c) => c.type === 'text')?.text;
  if (!text) throw new ProviderRequestError('Empty response from Anthropic');
  return text;
}

async function googleChat(input: ChatCompletionInput): Promise<string> {
  const base = trimSlash(input.profile.baseURL);
  const url = `${base}/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(input.profile.apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: input.userMessage }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new ProviderRequestError(errText || res.statusText, res.status, errText);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ProviderRequestError('Empty response from Google');
  return text;
}

async function ollamaChat(input: ChatCompletionInput): Promise<string> {
  const base = trimSlash(input.profile.baseURL);
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: input.model,
      stream: false,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new ProviderRequestError(errText || res.statusText, res.status, errText);
  }

  const json = (await res.json()) as { message?: { content?: string } };
  const content = json.message?.content;
  if (!content) throw new ProviderRequestError('Empty response from Ollama');
  return content;
}

export async function callProviderChat(input: ChatCompletionInput): Promise<string> {
  const { protocol } = input.profile;

  switch (protocol) {
    case 'openai':
    case 'openai-compatible':
      return openAiCompatibleChat(input);
    case 'anthropic':
      return anthropicChat(input);
    case 'google':
      return googleChat(input);
    case 'ollama':
      return ollamaChat(input);
    default:
      throw new ProviderRequestError(`Unsupported protocol: ${protocol}`);
  }
}
