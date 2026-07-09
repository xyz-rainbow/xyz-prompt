/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Prompt, Vote, Feedback, AppMode, Translations, ChatMessage, VersusOutputs, ProviderProfile, AiSettings } from '../types';
import { db } from '../db/schema';
import { en, es } from '../i18n/translations';
import { generateChatResponse } from '../services/aiService';
import { createDefaultProfiles } from '../lib/providers/provider-profile';

const DEFAULT_AI_SETTINGS: AiSettings = {
  id: 'default',
  activeProviderId: null,
  activeModelId: 'gpt-4o-mini',
  preferMock: true,
};

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

  // Chat mock outputs
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  versusOutputs: VersusOutputs | null;
  sendChatMessage: (message: string) => Promise<void>;
  clearChat: () => void;

  // AI providers
  providers: ProviderProfile[];
  aiSettings: AiSettings;
  upsertProvider: (input: Partial<ProviderProfile> & { id: string }) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  setActiveModel: (providerId: string, modelId: string) => Promise<void>;
  setPreferMock: (preferMock: boolean) => Promise<void>;
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
  sidebarOpen: true,
  sidebarOpenedByHover: false,
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
      sidebarOpenedByHover: false,
    })),
  setSidebarOpen: (sidebarOpen) =>
    set({ sidebarOpen, sidebarOpenedByHover: false }),
  openSidebarByHover: () => set({ sidebarOpen: true, sidebarOpenedByHover: true }),
  closeSidebarIfHoverOpened: () =>
    set((state) =>
      state.sidebarOpenedByHover
        ? { sidebarOpen: false, sidebarOpenedByHover: false }
        : state,
    ),
  clearSidebarHoverOpen: () => set({ sidebarOpenedByHover: false }),
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

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
  versusOutputs: null,

  clearChat: () => set({ chatMessages: [], versusOutputs: null, chatLoading: false }),

  sendChatMessage: async (message) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const { activeMode, prompts, activePageIndex, versusPrompts, language } = get();

    if (activeMode === 'metrics' || (activeMode === 'pages' && prompts.length === 0)) {
      const words = trimmed.split(/\s+/);
      const titleSnippet = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
      const defaultTitle = language === 'es' ? `Borrador: ${titleSnippet}` : `Draft: ${titleSnippet}`;
      await get().addPrompt(defaultTitle, trimmed, 'chat_input');
      return;
    }

    if (activeMode === 'pages') {
      const activePrompt = prompts[activePageIndex] || prompts[0];
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        promptId: activePrompt.id,
      };
      set({ chatMessages: [...get().chatMessages, userMsg], chatLoading: true });

      const response = await generateChatResponse(activePrompt.content, trimmed, undefined, get().getActiveProvider(), get().aiSettings);
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
      return;
    }

    if (activeMode === 'versus' && versusPrompts) {
      const [promptA, promptB] = versusPrompts;
      set({
        chatLoading: true,
        versusOutputs: { promptA: null, promptB: null, userMessage: trimmed },
      });

      const [outA, outB] = await Promise.all([
        generateChatResponse(promptA.content, trimmed, 'ALPHA', get().getActiveProvider(), get().aiSettings),
        generateChatResponse(promptB.content, trimmed, 'BETA', get().getActiveProvider(), get().aiSettings),
      ]);

      set({
        versusOutputs: { promptA: outA, promptB: outB, userMessage: trimmed },
        chatLoading: false,
      });
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
          enabled: input.enabled ?? true,
          builtin: input.builtin ?? false,
          defaultBaseURL: input.defaultBaseURL ?? input.baseURL ?? '',
          manualModels: input.manualModels ?? ['default-model'],
          ...input,
          id: input.id,
        };

    await db.providers.put(merged);

    const { aiSettings } = get();
    if (merged.enabled && !aiSettings.activeProviderId) {
      const nextSettings: AiSettings = {
        ...aiSettings,
        activeProviderId: merged.id,
        activeModelId: merged.manualModels[0] ?? aiSettings.activeModelId,
        preferMock: false,
      };
      await db.aiSettings.put(nextSettings);
      set({ aiSettings: nextSettings });
    }

    await get().refreshFromDb();
  },

  deleteProvider: async (id) => {
    const profile = await db.providers.get(id);
    if (!profile || profile.builtin) return;
    await db.providers.delete(id);

    const { aiSettings } = get();
    if (aiSettings.activeProviderId === id) {
      const remaining = await db.providers.filter((p) => p.enabled).first();
      const nextSettings: AiSettings = {
        ...aiSettings,
        activeProviderId: remaining?.id ?? null,
        activeModelId: remaining?.manualModels[0] ?? aiSettings.activeModelId,
        preferMock: !remaining,
      };
      await db.aiSettings.put(nextSettings);
      set({ aiSettings: nextSettings });
    }

    await get().refreshFromDb();
  },

  setActiveModel: async (providerId, modelId) => {
    const nextSettings: AiSettings = {
      ...get().aiSettings,
      activeProviderId: providerId,
      activeModelId: modelId,
      preferMock: false,
    };
    await db.aiSettings.put(nextSettings);
    set({ aiSettings: nextSettings });
  },

  setPreferMock: async (preferMock) => {
    const nextSettings: AiSettings = { ...get().aiSettings, preferMock };
    await db.aiSettings.put(nextSettings);
    set({ aiSettings: nextSettings });
  },
}));
