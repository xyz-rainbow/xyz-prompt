/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare, Copy, Check, Info, ArrowRight, CornerDownRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Prompt, VoteType, Feedback } from '../../types';
import { evaluatePromptWithAi, AiEvaluationResult } from '../../services/aiService';

interface MetricsPopupProps {
  prompt: Prompt;
  onClose: () => void;
}

export default function MetricsPopup({ prompt, onClose }: MetricsPopupProps) {
  const t = useStore((state) => state.t());
  const language = useStore((state) => state.language);
  const votes = useStore((state) => state.votes);
  const feedbacks = useStore((state) => state.feedbacks);
  const addFeedback = useStore((state) => state.addFeedback);

  const [copiedText, setCopiedText] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<AiEvaluationResult | null>(null);

  const [customComment, setCustomComment] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);

  // Aggregated calculations for this specific prompt
  const promptVotes = votes.filter((v) => v.promptId === prompt.id);
  const likesCount = promptVotes.filter((v) => v.type === 'like').length;
  const dislikesCount = promptVotes.filter((v) => v.type === 'dislike').length;
  const netScore = likesCount - dislikesCount;

  const promptFeedbacks = feedbacks
    .filter((f) => f.promptId === prompt.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyAiSuggestion = () => {
    if (!aiResult) return;
    navigator.clipboard.writeText(aiResult.suggestions);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2000);
  };

  const handleAiAudit = async () => {
    setLoadingAi(true);
    try {
      const evaluation = await evaluatePromptWithAi(prompt.content);
      setAiResult(evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleDraftAiFeedback = async () => {
    if (!aiResult) return;
    setCommentSaving(true);
    try {
      await addFeedback(prompt.id, aiResult.suggestedFeedback, 'metrics', true);
      setCustomComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customComment.trim()) return;

    setCommentSaving(true);
    try {
      await addFeedback(prompt.id, customComment.trim(), 'metrics', false);
      setCustomComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020203]/70 backdrop-blur-md animate-fade-in">
      <div 
        id="metrics-modal"
        className="w-full max-w-5xl h-[85vh] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* Left main metrics view (Main content) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 font-mono text-xs font-bold text-indigo-400">
                  #{prompt.number}
                </span>
                <h3 className="font-display font-bold text-slate-100 text-base max-w-[340px] truncate">
                  {prompt.title}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aggregated Score Pill Row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center backdrop-blur-md">
                <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">{t.metricsMode.score}</span>
                <span className={`block text-xl font-bold font-mono mt-1 ${netScore >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                  {netScore > 0 ? `+${netScore}` : netScore}
                </span>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center backdrop-blur-md">
                <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">{t.metricsMode.likes}</span>
                <span className="block text-xl font-bold font-mono text-indigo-400 mt-1">+{likesCount}</span>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center backdrop-blur-md">
                <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">{t.metricsMode.dislikes}</span>
                <span className="block text-xl font-bold font-mono text-fuchsia-400 mt-1">-{dislikesCount}</span>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-center backdrop-blur-md">
                <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase">{t.metricsMode.feedbacks}</span>
                <span className="block text-xl font-bold font-mono text-fuchsia-300 mt-1">{promptFeedbacks.length}</span>
              </div>
            </div>

            {/* Prompt Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                  <Info className="w-3.5 h-3.5" />
                  {t.metricsMode.promptText}
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer text-[11px]"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-mono">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-[#050507]/40 border border-white/5 rounded-xl p-4 max-h-[140px] overflow-y-auto shadow-inner">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all leading-relaxed">{prompt.content}</pre>
              </div>
            </div>

            {/* AI Expert Auditor Section */}
            <div className="border-t border-white/5 pt-5 space-y-4">
              {!aiResult && !loadingAi ? (
                <div className="rounded-xl border border-dashed border-fuchsia-500/20 bg-fuchsia-500/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-fuchsia-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      {t.metricsMode.aiEvaluation}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                      {t.metricsMode.aiEvalDesc}
                    </p>
                  </div>
                  <button
                    onClick={handleAiAudit}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-slate-100 font-semibold text-xs px-4 py-2 cursor-pointer shadow-lg border border-white/10 transition-all hover:scale-105"
                  >
                    {language === 'es' ? 'Auditar con IA' : 'Run AI Audit'}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4.5 space-y-4 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-xs font-bold text-fuchsia-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      {t.metricsMode.aiEvaluation}
                    </h4>
                    {aiResult && (
                      <span className="rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-0.5 text-xs font-bold text-fuchsia-400 font-mono">
                        {t.metricsMode.aiScore}: {aiResult.score}/100
                      </span>
                    )}
                  </div>

                  {loadingAi ? (
                    <div className="space-y-3 py-4 animate-pulse">
                      <div className="h-2 bg-white/5 rounded w-11/12"></div>
                      <div className="h-2 bg-white/5 rounded w-5/6"></div>
                      <div className="h-2 bg-white/5 rounded w-4/5"></div>
                    </div>
                  ) : (
                    aiResult && (
                      <div className="space-y-4 text-xs animate-fade-in">
                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">{t.metricsMode.aiStrengths}</span>
                            <ul className="space-y-1 text-[11px] text-slate-300">
                              {aiResult.strengths.map((str, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-400 font-bold">{t.metricsMode.aiWeaknesses}</span>
                            <ul className="space-y-1 text-[11px] text-slate-300">
                              {aiResult.weaknesses.map((wk, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-fuchsia-400 mt-0.5 shrink-0" />
                                  <span>{wk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Recommendation Codebox */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-400 font-bold">{t.metricsMode.aiSuggestions}</span>
                            <button
                              onClick={handleCopyAiSuggestion}
                              className="text-[10px] text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedAi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>Copy Sug.</span>
                            </button>
                          </div>
                          <div className="bg-[#050507]/40 border border-white/5 rounded-xl p-3 max-h-[140px] overflow-y-auto shadow-inner">
                            <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap">{aiResult.suggestions}</pre>
                          </div>
                        </div>

                        {/* Drafting Action */}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={handleDraftAiFeedback}
                            disabled={commentSaving}
                            className="flex items-center gap-1.5 rounded bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 text-fuchsia-400 font-semibold text-[10px] px-3 py-1.5 tracking-wider uppercase cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {t.metricsMode.aiAutofill}
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right slide-out comment column */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/10 bg-white/[0.01] p-5 flex flex-col justify-between overflow-hidden backdrop-blur-md">
          <div className="space-y-4 flex flex-col h-full overflow-hidden">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 border-b border-white/5 pb-2 shrink-0">
              <MessageSquare className="w-4 h-4 text-fuchsia-400" />
              {t.metricsMode.feedbacksList}
            </h4>

            {/* Comment scrolling list */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
              {promptFeedbacks.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs italic">
                  {t.metricsMode.noFeedbacksYet}
                </div>
              ) : (
                promptFeedbacks.map((fb) => (
                  <div 
                    key={fb.id} 
                    className={`rounded-xl border p-3 space-y-2 relative transition-all ${
                      fb.byAi 
                        ? 'bg-fuchsia-500/5 border-fuchsia-500/10 shadow-[0_0_8px_rgba(217,70,239,0.03)]' 
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className={`text-[9px] font-mono font-semibold tracking-wider uppercase ${fb.byAi ? 'text-fuchsia-400' : 'text-slate-400'}`}>
                        {fb.byAi ? 'AI Auditor' : 'User Feed'}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">
                        {fb.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed break-words">{fb.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Quick manual comment composer inside modal */}
            <form onSubmit={handleAddComment} className="border-t border-white/5 pt-3 flex gap-2 shrink-0">
              <input
                type="text"
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                placeholder={t.language === 'es' ? 'Añadir comentario...' : 'Add custom comment...'}
                disabled={commentSaving}
                className="flex-grow rounded-lg border border-white/10 bg-[#050507]/40 p-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-fuchsia-500/50 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={commentSaving || !customComment.trim()}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-slate-100 p-2 cursor-pointer transition-colors border border-white/10"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
