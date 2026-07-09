/**
 * Catálogo y clasificación de errores de proveedores IA.
 */

import type { AiSettings, ProviderProfile } from '../../types';
import { isLocalBaseURL, isProfileConfigured } from './provider-profile';

export type ProviderErrorCode =
  | 'no_provider'
  | 'provider_disabled'
  | 'provider_not_configured'
  | 'no_active_model'
  | 'network_offline'
  | 'network_failed'
  | 'cors_blocked'
  | 'local_unreachable'
  | 'auth_missing'
  | 'auth_invalid'
  | 'rate_limit'
  | 'quota_exceeded'
  | 'model_not_found'
  | 'bad_request'
  | 'server_error'
  | 'empty_response'
  | 'unsupported_protocol'
  | 'timeout'
  | 'unknown';

export interface ChatErrorInfo {
  code: ProviderErrorCode;
  message: string;
  hint: string;
  detail?: string;
}

export class ProviderRequestError extends Error {
  readonly status?: number;
  readonly body?: string;

  constructor(message: string, status?: number, body?: string) {
    super(message);
    this.name = 'ProviderRequestError';
    this.status = status;
    this.body = body;
  }
}

type ErrorCopy = Record<ProviderErrorCode, { message: string; hint: string }>;

const ERROR_COPY_EN: ErrorCopy = {
  no_provider: {
    message: 'No AI provider is active.',
    hint: 'Open Settings, enable a provider, set its API key or local URL, and pick an active model.',
  },
  provider_disabled: {
    message: 'The selected provider is disabled.',
    hint: 'Enable the provider in Settings and verify its configuration.',
  },
  provider_not_configured: {
    message: 'The provider is not fully configured.',
    hint: 'Add a Base URL and API key (if required), then save the model list.',
  },
  no_active_model: {
    message: 'No active model is selected.',
    hint: 'Choose a model in the provider card under Settings.',
  },
  network_offline: {
    message: 'No internet connection detected.',
    hint: 'Check your network connection and try again.',
  },
  network_failed: {
    message: 'The request could not reach the provider.',
    hint: 'Verify the Base URL, firewall rules, and that the service is running.',
  },
  cors_blocked: {
    message: 'The browser blocked the request (CORS).',
    hint: 'Cloud APIs often fail from the browser. Prefer local providers (Ollama, LM Studio) or a proxy.',
  },
  local_unreachable: {
    message: 'Cannot reach the local provider.',
    hint: 'Start Ollama or LM Studio and confirm the Base URL (e.g. http://127.0.0.1:11434).',
  },
  auth_missing: {
    message: 'API key is missing.',
    hint: 'Add your API key in Settings for this provider.',
  },
  auth_invalid: {
    message: 'Authentication failed (invalid or expired API key).',
    hint: 'Verify the API key, permissions, and billing status with your provider.',
  },
  rate_limit: {
    message: 'Rate limit exceeded.',
    hint: 'Wait a moment and retry, or switch to another model or provider.',
  },
  quota_exceeded: {
    message: 'Usage quota or billing limit reached.',
    hint: 'Check your provider dashboard for credits, billing, and usage limits.',
  },
  model_not_found: {
    message: 'The selected model was not found.',
    hint: 'Edit the model list in Settings and pick a model available on your provider.',
  },
  bad_request: {
    message: 'The provider rejected the request.',
    hint: 'Check the model id, message size, and provider-specific parameters.',
  },
  server_error: {
    message: 'The provider returned a server error.',
    hint: 'Retry in a few seconds. If it persists, check the provider status page.',
  },
  empty_response: {
    message: 'The provider returned an empty response.',
    hint: 'Try another model or shorten the system prompt and user message.',
  },
  unsupported_protocol: {
    message: 'Unsupported provider protocol.',
    hint: 'Use OpenAI-compatible, Anthropic, Google, or Ollama protocols.',
  },
  timeout: {
    message: 'The provider took too long to respond.',
    hint: 'Retry with a smaller prompt or a faster local model.',
  },
  unknown: {
    message: 'An unexpected provider error occurred.',
    hint: 'Check the technical detail below and your provider configuration.',
  },
};

const ERROR_COPY_ES: ErrorCopy = {
  no_provider: {
    message: 'No hay ningún proveedor de IA activo.',
    hint: 'Abre Ajustes, activa un proveedor, configura API key o URL local y elige un modelo activo.',
  },
  provider_disabled: {
    message: 'El proveedor seleccionado está desactivado.',
    hint: 'Activa el proveedor en Ajustes y verifica su configuración.',
  },
  provider_not_configured: {
    message: 'El proveedor no está completamente configurado.',
    hint: 'Añade Base URL y API key (si aplica), luego guarda la lista de modelos.',
  },
  no_active_model: {
    message: 'No hay un modelo activo seleccionado.',
    hint: 'Elige un modelo en la tarjeta del proveedor dentro de Ajustes.',
  },
  network_offline: {
    message: 'No se detecta conexión a internet.',
    hint: 'Comprueba tu conexión de red e inténtalo de nuevo.',
  },
  network_failed: {
    message: 'No se pudo contactar con el proveedor.',
    hint: 'Verifica la Base URL, firewall y que el servicio esté en ejecución.',
  },
  cors_blocked: {
    message: 'El navegador bloqueó la petición (CORS).',
    hint: 'Las APIs en la nube suelen fallar en el navegador. Usa proveedores locales (Ollama, LM Studio) o un proxy.',
  },
  local_unreachable: {
    message: 'No se puede alcanzar el proveedor local.',
    hint: 'Inicia Ollama o LM Studio y confirma la Base URL (p. ej. http://127.0.0.1:11434).',
  },
  auth_missing: {
    message: 'Falta la API key.',
    hint: 'Añade tu API key en Ajustes para este proveedor.',
  },
  auth_invalid: {
    message: 'Autenticación fallida (API key inválida o expirada).',
    hint: 'Verifica la API key, permisos y estado de facturación con tu proveedor.',
  },
  rate_limit: {
    message: 'Límite de peticiones excedido.',
    hint: 'Espera un momento y reintenta, o cambia de modelo o proveedor.',
  },
  quota_exceeded: {
    message: 'Cuota de uso o límite de facturación alcanzado.',
    hint: 'Revisa créditos, facturación y límites en el panel de tu proveedor.',
  },
  model_not_found: {
    message: 'El modelo seleccionado no existe.',
    hint: 'Edita la lista de modelos en Ajustes y elige uno disponible en tu proveedor.',
  },
  bad_request: {
    message: 'El proveedor rechazó la petición.',
    hint: 'Revisa el id del modelo, tamaño del mensaje y parámetros del proveedor.',
  },
  server_error: {
    message: 'El proveedor devolvió un error de servidor.',
    hint: 'Reintenta en unos segundos. Si persiste, consulta el estado del proveedor.',
  },
  empty_response: {
    message: 'El proveedor devolvió una respuesta vacía.',
    hint: 'Prueba otro modelo o acorta el system prompt y el mensaje de usuario.',
  },
  unsupported_protocol: {
    message: 'Protocolo de proveedor no soportado.',
    hint: 'Usa protocolos OpenAI-compatible, Anthropic, Google u Ollama.',
  },
  timeout: {
    message: 'El proveedor tardó demasiado en responder.',
    hint: 'Reintenta con un prompt más corto o un modelo local más rápido.',
  },
  unknown: {
    message: 'Ocurrió un error inesperado del proveedor.',
    hint: 'Revisa el detalle técnico y la configuración del proveedor.',
  },
};

function copyFor(language: 'es' | 'en', code: ProviderErrorCode) {
  const table = language === 'es' ? ERROR_COPY_ES : ERROR_COPY_EN;
  return table[code];
}

export function buildChatError(
  code: ProviderErrorCode,
  language: 'es' | 'en',
  detail?: string
): ChatErrorInfo {
  const copy = copyFor(language, code);
  return {
    code,
    message: copy.message,
    hint: copy.hint,
    detail: detail?.trim() || undefined,
  };
}

export function checkChatProviderReadiness(
  provider: ProviderProfile | null,
  aiSettings: AiSettings,
  language: 'es' | 'en'
): ChatErrorInfo | null {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return buildChatError('network_offline', language);
  }

  if (!aiSettings.activeProviderId) {
    return buildChatError('no_provider', language);
  }

  if (!provider) {
    return buildChatError('no_provider', language);
  }

  if (!provider.enabled) {
    return buildChatError('provider_disabled', language, provider.label);
  }

  if (!isProfileConfigured(provider)) {
    const needsKey = provider.protocol !== 'ollama' && !isLocalBaseURL(provider.baseURL);
    return buildChatError(
      needsKey && !provider.apiKey.trim() ? 'auth_missing' : 'provider_not_configured',
      language,
      provider.label
    );
  }

  if (!aiSettings.activeModelId?.trim()) {
    return buildChatError('no_active_model', language, provider.label);
  }

  return null;
}

function bodyHints(body: string): ProviderErrorCode | null {
  const lower = body.toLowerCase();
  if (/quota|billing|insufficient|credit|balance|usage limit|exceeded your current/.test(lower)) {
    return 'quota_exceeded';
  }
  if (/rate limit|too many requests|requests per/.test(lower)) {
    return 'rate_limit';
  }
  if (/invalid api key|incorrect api key|authentication|unauthorized|invalid x-api-key/.test(lower)) {
    return 'auth_invalid';
  }
  if (/model.*not found|unknown model|does not exist/.test(lower)) {
    return 'model_not_found';
  }
  return null;
}

function statusToCode(status: number, body: string): ProviderErrorCode {
  const fromBody = bodyHints(body);
  if (fromBody) return fromBody;

  if (status === 401 || status === 403) return 'auth_invalid';
  if (status === 404) return 'model_not_found';
  if (status === 429) return 'rate_limit';
  if (status === 402) return 'quota_exceeded';
  if (status === 408) return 'timeout';
  if (status >= 500) return 'server_error';
  if (status >= 400) return 'bad_request';
  return 'unknown';
}

function isFetchFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    err.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  );
}

export function classifyProviderError(
  err: unknown,
  language: 'es' | 'en',
  provider?: ProviderProfile | null
): ChatErrorInfo {
  if (err instanceof ProviderRequestError) {
    const body = err.body ?? err.message;
    const code = err.status ? statusToCode(err.status, body) : bodyHints(body) ?? 'unknown';
    const detail = err.status ? `HTTP ${err.status}: ${body.slice(0, 240)}` : body.slice(0, 240);
    return buildChatError(code, language, detail);
  }

  if (isFetchFailure(err)) {
    const local = provider && (provider.protocol === 'ollama' || isLocalBaseURL(provider.baseURL));
    const code = local ? 'local_unreachable' : 'cors_blocked';
    const detail = err instanceof Error ? err.message : String(err);
    return buildChatError(code, language, detail);
  }

  if (err instanceof Error) {
    const lower = err.message.toLowerCase();
    if (lower.includes('empty response')) return buildChatError('empty_response', language, err.message);
    if (lower.includes('unsupported protocol')) {
      return buildChatError('unsupported_protocol', language, err.message);
    }
    if (lower.includes('timeout') || lower.includes('timed out')) {
      return buildChatError('timeout', language, err.message);
    }
    return buildChatError('unknown', language, err.message);
  }

  return buildChatError('unknown', language, String(err));
}

/** Lista de códigos documentados para referencia en UI o logs. */
export const PROVIDER_ERROR_CODES: ProviderErrorCode[] = [
  'no_provider',
  'provider_disabled',
  'provider_not_configured',
  'no_active_model',
  'network_offline',
  'network_failed',
  'cors_blocked',
  'local_unreachable',
  'auth_missing',
  'auth_invalid',
  'rate_limit',
  'quota_exceeded',
  'model_not_found',
  'bad_request',
  'server_error',
  'empty_response',
  'unsupported_protocol',
  'timeout',
  'unknown',
];
