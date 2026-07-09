/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Prompt, Vote, Feedback, AppMode, Translations, ChatMessage, VersusOutputs, ProviderProfile, AiSettings } from '../types';
import { db } from '../db/schema';
import { en, es } from '../i18n/translations';
import { generateChatResponse } from '../services/aiService';
import { createDefaultProfiles, isProfileConfigured } from '../lib/providers/provider-profile';
import { fetchProviderModels, type ProviderModelsSource } from '../services/providerModels';
import {
  type ChatErrorInfo,
  buildChatError,
  checkChatProviderReadiness,
  classifyProviderError,
} from '../lib/providers/provider-errors';
import {
  NAV_PANEL_WIDTH_KEY,
  SETTINGS_SIDEBAR_WIDTH_KEY,
  clampNavPanelWidth,
  clampSettingsSidebarWidth,
  persistPanelWidth,
  readStoredPanelWidth,
} from '../lib/panel-width';

export interface ProviderModelsRefreshResult {
  success: boolean;
  models?: string[];
  source?: ProviderModelsSource;
  error?: ChatErrorInfo;
}

const DEFAULT_AI_SETTINGS: AiSettings = {
  id: 'default',
  activeProviderId: null,
  activeModelId: 'gpt-4o-mini',
};

type StoreGetter = () => StoreState;
type StoreSetter = (
  partial: Partial<StoreState> | ((state: StoreState) => Partial<StoreState>),
) => void;

/** Solo un proveedor enabled a la vez; null = todos off */
async function setExclusiveActiveProvider(
  get: StoreGetter,
  set: StoreSetter,
  providerId: string | null,
  modelId?: string,
) {
  const all = await db.providers.toArray();
  const aiSettings = get().aiSettings;

  if (providerId) {
    const target = all.find((p) => p.id === providerId);
    const resolvedModelId = modelId ?? target?.manualModels[0] ?? aiSettings.activeModelId;
    await Promise.all(
      all.map((p) => db.providers.put({ ...p, enabled: p.id === providerId })),
    );
    const nextSettings: AiSettings = {
      ...aiSettings,
      activeProviderId: providerId,
      activeModelId: resolvedModelId,
    };
    await db.aiSettings.put(nextSettings);
    const providers = await db.providers.toArray();
    set({ aiSettings: nextSettings, providers });
    return;
  }

  await Promise.all(all.map((p) => db.providers.put({ ...p, enabled: false })));
  const nextSettings: AiSettings = {
    ...aiSettings,
    activeProviderId: null,
  };
  await db.aiSettings.put(nextSettings);
  const providers = await db.providers.toArray();
  set({ aiSettings: nextSettings, providers });
}

async function normalizeExclusiveProviders(
  providers: ProviderProfile[],
  aiSettings: AiSettings,
): Promise<{ providers: ProviderProfile[]; aiSettings: AiSettings }> {
  const enabledList = providers.filter((p) => p.enabled);

  if (enabledList.length > 1) {
    const keeperId =
      aiSettings.activeProviderId &&
      enabledList.some((p) => p.id === aiSettings.activeProviderId)
        ? aiSettings.activeProviderId
        : enabledList[0].id;
    await Promise.all(
      providers.map((p) =>
        p.enabled !== (p.id === keeperId)
          ? db.providers.put({ ...p, enabled: p.id === keeperId })
          : Promise.resolve(),
      ),
    );
    const nextProviders = await db.providers.toArray();
    const keeper = nextProviders.find((p) => p.id === keeperId);
    const nextSettings: AiSettings = {
      ...aiSettings,
      activeProviderId: keeperId,
      activeModelId: keeper?.manualModels[0] ?? aiSettings.activeModelId,
    };
    await db.aiSettings.put(nextSettings);
    return { providers: nextProviders, aiSettings: nextSettings };
  }

  if (enabledList.length === 1 && aiSettings.activeProviderId !== enabledList[0].id) {
    const nextSettings: AiSettings = {
      ...aiSettings,
      activeProviderId: enabledList[0].id,
      activeModelId: enabledList[0].manualModels[0] ?? aiSettings.activeModelId,
    };
    await db.aiSettings.put(nextSettings);
    return { providers, aiSettings: nextSettings };
  }

  if (enabledList.length === 0 && aiSettings.activeProviderId) {
    const nextSettings: AiSettings = {
      ...aiSettings,
      activeProviderId: null,
    };
    await db.aiSettings.put(nextSettings);
    return { providers, aiSettings: nextSettings };
  }

  return { providers, aiSettings };
}

interface StoreState {
  // i18n
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  t: () => Translations;

  // Sidebar & Settings
  sidebarOpen: boolean;
  sidebarOpenedByHover: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openSidebarByHover: () => void;
  closeSidebarIfHoverOpened: () => void;
  clearSidebarHoverOpen: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  settingsSidebarWidth: number;
  settingsSidebarResizing: boolean;
  navPanelWidth: number;
  setSettingsSidebarWidth: (width: number) => void;
  setSettingsSidebarResizing: (resizing: boolean) => void;
  setNavPanelWidth: (width: number) => void;
  recalcPanelWidths: () => void;

  // Modes & Navigation
  activeMode: AppMode;
  setActiveMode: (mode: AppMode) => void;
  activePageIndex: number;
  setActivePageIndex: (index: number) => void;
  selectedPagesPromptId: string | null;
  setSelectedPagesPromptId: (id: string | null) => void;

  // Versus state
  versusPrompts: [Prompt, Prompt] | null;
  setVersusPrompts: (prompts: [Prompt, Prompt] | null) => void;
  versusSelectedId: string | null;
  setVersusSelectedId: (id: string | null) => void;
  versusVotedIds: string[];
  setVersusVotedIds: (ids: string[]) => void;

  // Database cache
  prompts: Prompt[];
  votes: Vote[];
  feedbacks: Feedback[];

  // Database operations
  refreshFromDb: () => Promise<void>;
  addPrompt: (title: string, content: string, source: string) => Promise<Prompt>;
  updatePrompt: (id: string, title: string, content: string) => Promise<void>;
  addVote: (promptId: string, type: 'like' | 'dislike', mode: 'pages' | 'versus') => Promise<void>;
  addFeedback: (promptId: string, text: string, mode: AppMode, byAi?: boolean) => Promise<Feedback>;
  deletePrompt: (id: string) => Promise<void>;
  clearDatabase: () => Promise<void>;

  // Versus helper
  generateNextVersus: () => void;

  // Chat
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatError: ChatErrorInfo | null;
  versusOutputs: VersusOutputs | null;
  sendChatMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  clearChatError: () => void;

  // AI providers
  providers: ProviderProfile[];
  aiSettings: AiSettings;
  upsertProvider: (input: Partial<ProviderProfile> & { id: string }) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  setActiveModel: (providerId: string, modelId: string) => Promise<void>;
  refreshProviderModels: (providerId: string) => Promise<ProviderModelsRefreshResult>;
  getActiveProvider: () => ProviderProfile | null;
}

export const useStore = create<StoreState>((set, get) => ({
  // i18n defaults
  language: 'es',
  setLanguage: (language) => set({ language }),
  t: () => {
    return get().language === 'es' ? es : en;
  },

  // UI state defaults
  sidebarOpen: false,
  sidebarOpenedByHover: false,
  toggleSidebar: () =>
    set((state) => {
      const opening = !state.sidebarOpen;
      return {
        sidebarOpen: !state.sidebarOpen,
        sidebarOpenedByHover: false,
        ...(opening ? { settingsOpen: false } : {}),
      };
    }),
  setSidebarOpen: (sidebarOpen) =>
    set((state) => ({
      sidebarOpen,
      sidebarOpenedByHover: false,
      settingsOpen: sidebarOpen ? false : state.settingsOpen,
    })),
  openSidebarByHover: () =>
    set({ sidebarOpen: true, sidebarOpenedByHover: true, settingsOpen: false }),
  closeSidebarIfHoverOpened: () =>
    set((state) =>
      state.sidebarOpenedByHover
        ? { sidebarOpen: false, sidebarOpenedByHover: false }
        : state,
    ),
  clearSidebarHoverOpen: () => set({ sidebarOpenedByHover: false }),
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) =>
    set((state) =>
      settingsOpen
        ? { settingsOpen: true, sidebarOpen: false, sidebarOpenedByHover: false }
        : { settingsOpen: false },
    ),

  settingsSidebarWidth: readStoredPanelWidth(SETTINGS_SIDEBAR_WIDTH_KEY, (w) =>
    clampSettingsSidebarWidth(w),
  ),
  settingsSidebarResizing: false,
  navPanelWidth: readStoredPanelWidth(NAV_PANEL_WIDTH_KEY, (w) => clampNavPanelWidth(w)),
  setSettingsSidebarResizing: (settingsSidebarResizing) => set({ settingsSidebarResizing }),
  setSettingsSidebarWidth: (width) => {
    const state = get();
    const clamped = clampSettingsSidebarWidth(width, {
      navPanelOpen: state.settingsOpen,
      navPanelWidth: state.navPanelWidth,
    });
    persistPanelWidth(SETTINGS_SIDEBAR_WIDTH_KEY, clamped);
    set({ settingsSidebarWidth: clamped });
  },
  setNavPanelWidth: (width) => {
    const state = get();
    const clamped = clampNavPanelWidth(width, {
      settingsSidebarOpen: state.sidebarOpen,
      settingsSidebarWidth: state.settingsSidebarWidth,
    });
    persistPanelWidth(NAV_PANEL_WIDTH_KEY, clamped);
    set({ navPanelWidth: clamped });
  },
  recalcPanelWidths: () => {
    const state = get();
    const settingsSidebarWidth = clampSettingsSidebarWidth(state.settingsSidebarWidth, {
      navPanelOpen: state.settingsOpen,
      navPanelWidth: state.navPanelWidth,
    });
    const navPanelWidth = clampNavPanelWidth(state.navPanelWidth, {
      settingsSidebarOpen: state.sidebarOpen,
      settingsSidebarWidth: state.settingsSidebarWidth,
    });
    persistPanelWidth(SETTINGS_SIDEBAR_WIDTH_KEY, settingsSidebarWidth);
    persistPanelWidth(NAV_PANEL_WIDTH_KEY, navPanelWidth);
    set({ settingsSidebarWidth, navPanelWidth });
  },

  // Mode & navigation
  activeMode: 'pages',
  setActiveMode: (activeMode) => {
    set({ activeMode });
    get().clearChat();
    if (activeMode === 'versus') {
      get().generateNextVersus();
    }
  },
  activePageIndex: 0,
  setActivePageIndex: (activePageIndex) => {
    set({ activePageIndex, selectedPagesPromptId: null });
    get().clearChat();
  },
  selectedPagesPromptId: null,
  setSelectedPagesPromptId: (selectedPagesPromptId) => set({ selectedPagesPromptId }),

  // Versus defaults
  versusPrompts: null,
  versusSelectedId: null,
  versusVotedIds: [],
  setVersusPrompts: (versusPrompts) => set({ versusPrompts }),
  setVersusSelectedId: (versusSelectedId) => set({ versusSelectedId }),
  setVersusVotedIds: (versusVotedIds) => set({ versusVotedIds }),

  // Cache
  prompts: [],
  votes: [],
  feedbacks: [],

  // Sync operations
  refreshFromDb: async () => {
    const prompts = await db.prompts.orderBy('number').toArray();
    const votes = await db.votes.toArray();
    const feedbacks = await db.feedbacks.toArray();

    let providers = await db.providers.toArray();
    if (providers.length === 0) {
      const defaults = createDefaultProfiles();
      await db.providers.bulkAdd(defaults);
      providers = defaults;
    }

    let aiSettings = await db.aiSettings.get('default');
    if (!aiSettings) {
      aiSettings = DEFAULT_AI_SETTINGS;
      await db.aiSettings.put(aiSettings);
    }

    const normalized = await normalizeExclusiveProviders(providers, aiSettings);
    providers = normalized.providers;
    aiSettings = normalized.aiSettings;

    set({ prompts, votes, feedbacks, providers, aiSettings });
  },

  addPrompt: async (title, content, source) => {
    const count = await db.prompts.count();
    const id = crypto.randomUUID();
    const newPrompt: Prompt = {
      id,
      number: count + 1,
      title: title || `Prompt ${count + 1}`,
      content,
      source: source || 'manual',
      createdAt: new Date(),
    };

    await db.prompts.add(newPrompt);
    await get().refreshFromDb();
    return newPrompt;
  },
  
  updatePrompt: async (id, title, content) => {
    const prompt = await db.prompts.get(id);
    if (prompt) {
      prompt.title = title;
      prompt.content = content;
      await db.prompts.put(prompt);
      await get().refreshFromDb();
    }
  },

  addVote: async (promptId, type, mode) => {
    const id = crypto.randomUUID();
    const newVote: Vote = {
      id,
      promptId,
      type,
      mode,
      createdAt: new Date(),
    };

    await db.votes.add(newVote);
    await get().refreshFromDb();
  },

  addFeedback: async (promptId, text, mode, byAi = false) => {
    const id = crypto.randomUUID();
    const newFeedback: Feedback = {
      id,
      promptId,
      text,
      mode,
      createdAt: new Date(),
      byAi,
    };

    await db.feedbacks.add(newFeedback);
    await get().refreshFromDb();
    return newFeedback;
  },

  deletePrompt: async (id) => {
    await db.prompts.delete(id);
    // Delete associated votes & feedbacks
    await db.votes.where('promptId').equals(id).delete();
    await db.feedbacks.where('promptId').equals(id).delete();
    
    // Re-adjust numbers of remaining prompts
    const remaining = await db.prompts.orderBy('createdAt').toArray();
    await db.prompts.clear();
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].number = i + 1;
      await db.prompts.add(remaining[i]);
    }

    await get().refreshFromDb();
  },

  clearDatabase: async () => {
    await db.prompts.clear();
    await db.votes.clear();
    await db.feedbacks.clear();
    set({
      prompts: [],
      votes: [],
      feedbacks: [],
      activePageIndex: 0,
      selectedPagesPromptId: null,
      versusPrompts: null,
      versusSelectedId: null,
      versusVotedIds: [],
      chatMessages: [],
      versusOutputs: null,
      chatLoading: false,
      chatError: null,
    });
  },

  generateNextVersus: () => {
    const { prompts } = get();
    get().clearChat();
    if (prompts.length < 2) {
      set({ versusPrompts: null, versusSelectedId: null, versusVotedIds: [] });
      return;
    }

    const shuffled = [...prompts].sort(() => 0.5 - Math.random());
    set({
      versusPrompts: [shuffled[0], shuffled[1]],
      versusSelectedId: null,
      versusVotedIds: [],
    });
  },

  chatMessages: [],
  chatLoading: false,
  chatError: null,
  versusOutputs: null,

  clearChat: () => set({ chatMessages: [], versusOutputs: null, chatLoading: false, chatError: null }),
  clearChatError: () => set({ chatError: null }),

  sendChatMessage: async (message) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const { activeMode, prompts, activePageIndex, versusPrompts, language, aiSettings } = get();
    const provider = get().getActiveProvider();

    if (activeMode === 'metrics' || (activeMode === 'pages' && prompts.length === 0)) {
      const words = trimmed.split(/\s+/);
      const titleSnippet = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
      const defaultTitle = language === 'es' ? `Borrador: ${titleSnippet}` : `Draft: ${titleSnippet}`;
      await get().addPrompt(defaultTitle, trimmed, 'chat_input');
      return;
    }

    const readinessError = checkChatProviderReadiness(provider, aiSettings, language);
    if (readinessError) {
      set({ chatError: readinessError, chatLoading: false });
      return;
    }

    if (!provider) {
      set({ chatError: checkChatProviderReadiness(null, aiSettings, language), chatLoading: false });
      return;
    }

    set({ chatError: null });

    if (activeMode === 'pages') {
      const activePrompt = prompts[activePageIndex] || prompts[0];
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        promptId: activePrompt.id,
      };
      set({ chatMessages: [...get().chatMessages, userMsg], chatLoading: true });

      try {
        const response = await generateChatResponse(
          activePrompt.content,
          trimmed,
          undefined,
          provider,
          aiSettings
        );
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          promptId: activePrompt.id,
        };
        set({
          chatMessages: [...get().chatMessages, assistantMsg],
          chatLoading: false,
        });
      } catch (err) {
        set({
          chatLoading: false,
          chatError: classifyProviderError(err, language, provider),
        });
      }
      return;
    }

    if (activeMode === 'versus' && versusPrompts) {
      const [promptA, promptB] = versusPrompts;
      set({
        chatLoading: true,
        versusOutputs: { promptA: null, promptB: null, userMessage: trimmed },
      });

      try {
        const [outA, outB] = await Promise.all([
          generateChatResponse(promptA.content, trimmed, 'ALPHA', provider, aiSettings),
          generateChatResponse(promptB.content, trimmed, 'BETA', provider, aiSettings),
        ]);

        set({
          versusOutputs: { promptA: outA, promptB: outB, userMessage: trimmed },
          chatLoading: false,
        });
      } catch (err) {
        set({
          chatLoading: false,
          versusOutputs: null,
          chatError: classifyProviderError(err, language, provider),
        });
      }
    }
  },

  providers: [],
  aiSettings: DEFAULT_AI_SETTINGS,

  getActiveProvider: () => {
    const { providers, aiSettings } = get();
    if (!aiSettings.activeProviderId) return null;
    const profile = providers.find((p) => p.id === aiSettings.activeProviderId);
    if (!profile?.enabled) return null;
    return profile;
  },

  upsertProvider: async (input) => {
    const existing = await db.providers.get(input.id);
    const merged: ProviderProfile = existing
      ? { ...existing, ...input, id: input.id }
      : {
          label: input.label ?? input.id,
          protocol: input.protocol ?? 'openai-compatible',
          baseURL: input.baseURL ?? '',
          apiKey: input.apiKey ?? '',
          enabled: input.enabled ?? false,
          builtin: input.builtin ?? false,
          defaultBaseURL: input.defaultBaseURL ?? input.baseURL ?? '',
          manualModels: input.manualModels ?? ['default-model'],
          ...input,
          id: input.id,
        };

    const isManualModelsOnly =
      input.manualModels !== undefined &&
      input.enabled === undefined &&
      input.baseURL === undefined &&
      input.apiKey === undefined;

    if (input.enabled === true) {
      await db.providers.put({ ...merged, enabled: true });
      await setExclusiveActiveProvider(get, set, merged.id, merged.manualModels[0]);
    } else if (input.enabled === false) {
      merged.enabled = false;
      await db.providers.put(merged);
      if (get().aiSettings.activeProviderId === merged.id) {
        await setExclusiveActiveProvider(get, set, null);
      }
    } else {
      await db.providers.put(merged);
    }

    await get().refreshFromDb();

    const shouldAutoRefresh =
      !isManualModelsOnly &&
      isProfileConfigured(merged) &&
      (input.enabled === true ||
        input.baseURL !== undefined ||
        (input.apiKey !== undefined && input.apiKey.trim().length > 0));

    if (shouldAutoRefresh) {
      await get().refreshProviderModels(merged.id);
    }
  },

  deleteProvider: async (id) => {
    const profile = await db.providers.get(id);
    if (!profile || profile.builtin) return;
    await db.providers.delete(id);

    const { aiSettings } = get();
    if (aiSettings.activeProviderId === id) {
      await setExclusiveActiveProvider(get, set, null);
    }

    await get().refreshFromDb();
  },

  setActiveModel: async (providerId, modelId) => {
    await setExclusiveActiveProvider(get, set, providerId, modelId);
    await get().refreshFromDb();
  },

  refreshProviderModels: async (providerId) => {
    const language = get().language;
    const profile = await db.providers.get(providerId);

    if (!profile) {
      return {
        success: false,
        error: buildChatError('unknown', language, `Provider not found: ${providerId}`),
      };
    }

    if (!isProfileConfigured(profile)) {
      return {
        success: false,
        error: buildChatError('provider_not_configured', language, profile.label),
      };
    }

    try {
      const { models, source } = await fetchProviderModels(profile);
      await db.providers.put({ ...profile, manualModels: models });

      const { aiSettings } = get();
      if (aiSettings.activeProviderId === providerId) {
        const activeStillValid = models.includes(aiSettings.activeModelId);
        const nextModel = activeStillValid ? aiSettings.activeModelId : models[0];
        if (nextModel && nextModel !== aiSettings.activeModelId) {
          await setExclusiveActiveProvider(get, set, providerId, nextModel);
        }
      }

      await get().refreshFromDb();
      return { success: true, models, source };
    } catch (err) {
      return {
        success: false,
        error: classifyProviderError(err, language, profile),
      };
    }
  },
}));
