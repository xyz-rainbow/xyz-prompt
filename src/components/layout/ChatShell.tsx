/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, CornerDownRight, PlusCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import NavPanelToggle from '../chat/NavPanelToggle';
import NavigationPanel from './NavigationPanel';
import PagesView from '../../views/PagesView';
import VersusView from '../../views/VersusView';
import MetricsView from '../../views/MetricsView';
import AddPromptPopup from '../prompts/AddPromptPopup';
import OutputList from '../chat/OutputList';
import FeedbackComposer from '../rate/FeedbackComposer';
import BrandMark from './BrandMark';
import DismissibleBanner from './DismissibleBanner';
import ModeNav from './ModeNav';

export default function ChatShell() {
  const t = useStore((state) => state.t());
  const activeMode = useStore((state) => state.activeMode);
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
    clearChatError();

    await sendChatMessage(text);
    if (!useStore.getState().chatError) {
      setInputText('');
    }
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
        className="rgb-border-container rgb-border-glow shadow-2xl w-full min-w-0 h-full min-h-0 flex flex-col overflow-hidden"
      >
        <div className="rgb-border-inner h-full relative flex flex-col overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 relative bg-[#0a0a0c]/85 backdrop-blur-3xl z-10">
            <div className="flex min-w-0 items-center gap-2 border-b border-white/5 pb-4 shrink-0 overflow-hidden sm:gap-3">
              <div className="min-w-0 shrink overflow-hidden">
                <BrandMark size="sm" />
              </div>

              <div className="flex min-w-0 flex-1 justify-center overflow-hidden px-0.5">
                <ModeNav />
              </div>

              <div className="shrink-0">
                <NavPanelToggle />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-start min-h-0 py-4 overflow-y-auto overflow-x-hidden">
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

              {activeMode === 'pages' && <PagesView />}
              {activeMode === 'versus' && <VersusView />}
              {activeMode === 'metrics' && <MetricsView />}
            </div>

            <div className="min-w-0 shrink-0 space-y-3 border-t border-white/5 pt-4 pb-1">
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
                <form onSubmit={handleSend} className="flex min-w-0 w-full items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setAddDirectOpen(true)}
                    title={t.sidebar.addPrompt}
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-lime-400 hover:border-lime-500/30 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>

                  <div className="relative min-w-0 flex-1">
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

              <div className="flex min-w-0 items-center justify-between gap-2 text-[9px] text-white/30 font-mono tracking-wider">
                <span className="min-w-0 truncate">LOCAL CACHE: READY (PROMPTS: {prompts.length})</span>
                <span className="hidden shrink-0 sm:inline">{t.toggleSettingsShortcut}</span>
              </div>
            </div>
          </div>

          <NavigationPanel />
        </div>
      </div>

      {addDirectOpen && <AddPromptPopup onClose={() => setAddDirectOpen(false)} />}
    </>
  );
}
