/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, CornerDownRight, PlusCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SettingsBall from '../chat/SettingsBall';
import SettingsPanel from './SettingsPanel';
import PagesView from '../../views/PagesView';
import VersusView from '../../views/VersusView';
import MetricsView from '../../views/MetricsView';
import AddPromptPopup from '../prompts/AddPromptPopup';
import OutputList from '../chat/OutputList';
import FeedbackComposer from '../rate/FeedbackComposer';
import BrandMark from './BrandMark';
import DismissibleBanner from './DismissibleBanner';

export default function ChatShell() {
  const t = useStore((state) => state.t());
  const language = useStore((state) => state.language);
  const activeMode = useStore((state) => state.activeMode);
  const setActiveMode = useStore((state) => state.setActiveMode);
  const prompts = useStore((state) => state.prompts);
  const sendChatMessage = useStore((state) => state.sendChatMessage);
  const chatMessages = useStore((state) => state.chatMessages);
  const chatLoading = useStore((state) => state.chatLoading);
  const chatError = useStore((state) => state.chatError);
  const clearChatError = useStore((state) => state.clearChatError);
  const activePageIndex = useStore((state) => state.activePageIndex);
  const selectedPagesPromptId = useStore((state) => state.selectedPagesPromptId);
  const setSelectedPagesPromptId = useStore((state) => state.setSelectedPagesPromptId);
  const versusSelectedId = useStore((state) => state.versusSelectedId);
  const setVersusSelectedId = useStore((state) => state.setVersusSelectedId);

  const [addDirectOpen, setAddDirectOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const activePrompt = prompts[activePageIndex];
  const pageMessages = activePrompt
    ? chatMessages.filter((m) => m.promptId === activePrompt.id)
    : chatMessages;

  const isFeedbackMode =
    (activeMode === 'pages' && selectedPagesPromptId) ||
    (activeMode === 'versus' && versusSelectedId);

  const feedbackPromptId =
    activeMode === 'pages' ? selectedPagesPromptId : versusSelectedId;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || chatLoading) return;

    const text = inputText.trim();
    setInputText('');
    clearChatError();

    if (activeMode === 'metrics' || (activeMode === 'pages' && prompts.length === 0)) {
      await sendChatMessage(text);
      const successMsg =
        language === 'es'
          ? '¡Prompt guardado! Ve a Páginas o Versus para calificarlo.'
          : 'Prompt saved! Go to Pages or Versus to rate it.';
      setBannerMessage(successMsg);
      setTimeout(() => setBannerMessage(null), 5000);
      return;
    }

    await sendChatMessage(text);
  };

  const inputPlaceholder =
    activeMode === 'pages'
      ? t.chat.placeholderPages
      : activeMode === 'versus'
        ? t.chat.placeholderVersus
        : t.chat.placeholderMetrics;

  return (
    <>
      <div
        id="chatshell-container"
        className="rgb-border-container rgb-border-glow shadow-2xl w-full h-full min-h-0 flex flex-col overflow-hidden"
      >
        <div className="rgb-border-inner h-full relative flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-5 sm:p-6 relative bg-[#0a0a0c]/85 backdrop-blur-3xl z-10">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 shrink-0">
              <div className="min-w-0 shrink">
                <BrandMark size="sm" />
              </div>

              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shadow-lg">
                {(['pages', 'versus', 'metrics'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveMode(mode)}
                    className={`px-4 sm:px-5 py-1.5 text-xs font-semibold rounded-full tracking-wide transition-all cursor-pointer ${
                      activeMode === mode
                        ? 'bg-white/10 text-lime-300 shadow-lg border border-white/10'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {t.modes[mode]}
                  </button>
                ))}
              </div>

              <SettingsBall />
            </div>

            <div className="flex-1 flex flex-col justify-start min-h-0 py-4 overflow-y-auto">
              {chatError && (
                <DismissibleBanner
                  variant="error"
                  message={chatError.message}
                  hint={chatError.hint}
                  detail={chatError.detail}
                  dismissLabel={t.errors.dismiss}
                  onDismiss={clearChatError}
                />
              )}

              {bannerMessage && (
                <DismissibleBanner
                  variant="success"
                  message={bannerMessage}
                  dismissLabel={t.errors.dismiss}
                  onDismiss={() => setBannerMessage(null)}
                />
              )}

              {activeMode === 'pages' && <PagesView />}
              {activeMode === 'versus' && <VersusView />}
              {activeMode === 'metrics' && <MetricsView />}
            </div>

            <div className="border-t border-white/5 pt-4 pb-1 space-y-3 shrink-0">
              {activeMode === 'pages' && (
                <OutputList messages={pageMessages} loading={chatLoading} />
              )}

              {isFeedbackMode && feedbackPromptId ? (
                <FeedbackComposer
                  promptId={feedbackPromptId}
                  mode={activeMode === 'versus' ? 'versus' : 'pages'}
                  onCompleted={() => {
                    setSelectedPagesPromptId(null);
                    setVersusSelectedId(null);
                  }}
                />
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setAddDirectOpen(true)}
                    title={t.sidebar.addPrompt}
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-lime-400 hover:border-lime-500/30 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>

                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={inputPlaceholder}
                      disabled={chatLoading}
                      className="w-full h-10 px-4 pr-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/[0.08] focus:bg-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:border-lime-500/50 focus:outline-none transition-all disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || chatLoading}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-lime-500 to-purple-600 hover:from-lime-400 hover:to-purple-500 disabled:from-white/5 disabled:to-white/5 disabled:text-slate-600 text-slate-100 border border-white/10 shadow-lg cursor-pointer transition-all shrink-0"
                    title={t.chat.send}
                  >
                    <CornerDownRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="flex justify-between items-center text-[9px] text-white/30 font-mono tracking-wider">
                <span>LOCAL CACHE: READY (PROMPTS: {prompts.length})</span>
                <span>CTRL+B TO TOGGLE PANEL</span>
              </div>
            </div>
          </div>

          <SettingsPanel />
        </div>
      </div>

      {addDirectOpen && <AddPromptPopup onClose={() => setAddDirectOpen(false)} />}
    </>
  );
}
