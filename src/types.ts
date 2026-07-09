/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Prompt {
  id: string; // UUID or string id
  number: number; // Order/Identifier number
  title: string; // Short title or description of prompt
  content: string; // The prompt text
  source: string; // Upload file name, 'clipboard', or 'manual'
  createdAt: Date;
}

export type VoteType = 'like' | 'dislike';
export type AppMode = 'pages' | 'versus' | 'metrics';

export interface Vote {
  id: string;
  promptId: string;
  type: VoteType;
  mode: 'pages' | 'versus';
  createdAt: Date;
}

export interface Feedback {
  id: string;
  promptId: string;
  text: string;
  mode: AppMode;
  createdAt: Date;
  byAi: boolean;
}

export interface PromptMetrics {
  likes: number;
  dislikes: number;
  score: number; // likes - dislikes
  feedbackCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  promptId?: string;
  label?: string;
}

export interface VersusOutputs {
  promptA: string | null;
  promptB: string | null;
  userMessage: string;
}

export type ProviderProtocol =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openai-compatible'
  | 'ollama';

export interface ProviderProfile {
  id: string;
  label: string;
  protocol: ProviderProtocol;
  baseURL: string;
  apiKey: string;
  enabled: boolean;
  builtin: boolean;
  defaultBaseURL: string;
  manualModels: string[];
}

export interface AiSettings {
  id: 'default';
  activeProviderId: string | null;
  activeModelId: string;
}

// Translations type
export interface Translations {
  title: string;
  subtitle: string;
  menu: string;
  settings: string;
  modes: {
    pages: string;
    versus: string;
    metrics: string;
  };
  sidebar: {
    title: string;
    description: string;
    addPrompt: string;
    totalPrompts: string;
    allRightsReserved: string;
    shortcutInfo: string;
    quickStats: string;
  };
  pagesMode: {
    noPrompts: string;
    noPromptsDesc: string;
    promptNum: string;
    selectPrompt: string;
    selected: string;
    placeholderFeedback: string;
    submitFeedback: string;
    feedbackSubmitted: string;
  };
  versusMode: {
    title: string;
    subtitle: string;
    compareTitle: string;
    promptA: string;
    promptB: string;
    voteForA: string;
    voteForB: string;
    orDraw: string;
    dislikeBoth: string;
    nextVersus: string;
    selectPromptToComment: string;
    bothVoted: string;
    addFeedbackToSelected: string;
  };
  metricsMode: {
    title: string;
    subtitle: string;
    gridTitle: string;
    score: string;
    likes: string;
    dislikes: string;
    feedbacks: string;
    noFeedbacksYet: string;
    aiEvaluation: string;
    aiEvalDesc: string;
    aiAutofill: string;
    aiEvalProgress: string;
    promptText: string;
    popupTitle: string;
    feedbacksList: string;
    loading: string;
    aiScore: string;
    aiStrengths: string;
    aiWeaknesses: string;
    aiSuggestions: string;
  };
  addPrompt: {
    title: string;
    titleLabel: string;
    titlePlaceholder: string;
    contentLabel: string;
    contentPlaceholder: string;
    uploadFiles: string;
    dragAndDrop: string;
    clipboardPaste: string;
    clipboardSuccess: string;
    clipboardError: string;
    save: string;
    cancel: string;
    parserError: string;
    invalidJson: string;
    successAdded: string;
  };
  theme: string;
  language: string;
  chat: {
    placeholderPages: string;
    placeholderVersus: string;
    placeholderMetrics: string;
    send: string;
    thinking: string;
    simulatedResponse: string;
  };
  errors: {
    dismiss: string;
  };
  providers: {
    title: string;
    subtitle: string;
    baseUrl: string;
    apiKey: string;
    set: string;
    clear: string;
    reset: string;
    enabled: string;
    online: string;
    disconnected: string;
    modelsAvailable: string;
    noModels: string;
    manualList: string;
    hideManualList: string;
    saveList: string;
    manualHint: string;
    addProvider: string;
    name: string;
    protocol: string;
    activeModel: string;
    refreshModels: string;
    refreshingModels: string;
    modelsFetched: string;
    modelsFetchFailed: string;
    selectModelPlaceholder: string;
    saved: string;
    cleared: string;
    delete: string;
    cancel: string;
    add: string;
    customProvider: string;
  };
}
