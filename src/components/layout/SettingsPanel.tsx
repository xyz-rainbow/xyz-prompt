/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Globe, Database, Sparkles, Plus, Trash2, X, Pencil } from 'lucide-react';
import { useStore } from '../../store/useStore';
import AddPromptPopup from '../prompts/AddPromptPopup';
import EditPromptPopup from '../prompts/EditPromptPopup';
import AiProvidersSection from '../settings/AiProvidersSection';
import { Prompt } from '../../types';

export default function SettingsPanel() {
  const settingsOpen = useStore((state) => state.settingsOpen);
  const setSettingsOpen = useStore((state) => state.setSettingsOpen);
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  const t = useStore((state) => state.t());

  const prompts = useStore((state) => state.prompts);
  const addPrompt = useStore((state) => state.addPrompt);
  const deletePrompt = useStore((state) => state.deletePrompt);
  const clearDatabase = useStore((state) => state.clearDatabase);

  const [addOpen, setAddOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await addPrompt(
        language === 'es' ? 'Asistente de Escritura Creativa' : 'Creative Writing Assistant',
        `Act as an expert developmental editor and novelist. Your task is to critique and polish the following chapter snippet.\n\n## Guidelines\n- Evaluate pacing, character voice, and narrative tension.\n- Provide exactly three actionable editing suggestions.\n- Rewrite a selected sentence in two distinct styles (e.g., lyrical and minimalist).\n\n## Rules\n- Output in clean Markdown.\n- Do NOT include intro or outro conversational filler.\n\n## Snippet Data\n\`\`\`\n{{draft_snippet}}\n\`\`\`\n\n## Detailed Critique`,
        'seed'
      );

      await addPrompt(
        language === 'es' ? 'Refactorizador de Código TS' : 'TS Code Refactoring Coach',
        `You are a staff engineer specialized in clean code, performance, and modern TypeScript patterns.\n\n## Goal\nAnalyze the provided typescript snippet for performance leaks, redundant calculations, and type safety issues.\n\n## Constraints\n- Output format: Markdown with split codeblocks (Before and After).\n- Keep explanations brief and technical.\n- Highlight potential edge cases or bugs.\n\n## Snippet\n\`\`\`typescript\n{{code_to_refactor}}\n\`\`\`\n\n## Refactored TypeScript Output`,
        'seed'
      );

      await addPrompt(
        language === 'es' ? 'Copywriter Persuasivo AIDA' : 'AIDA Persuasive Copywriter',
        `Act as an elite copywriter trained in behavioral psychology. Your role is to write a highly converting product launch copy based on the description below.\n\nApply the AIDA Framework (Attention, Interest, Desire, Action):\n- **Attention**: Hook the audience with a bold, eye-opening headline.\n- **Interest**: Address a core pain point and introduce the solution.\n- **Desire**: Illustrate premium emotional and functional benefits.\n- **Action**: Add a clear, friction-free CTA.\n\nProduct/Service Details:\n{{product_description}}\n\nTarget Persona: {{target_persona}}\n\nConversion Copy Output`,
        'seed'
      );
    } catch (err) {
      console.error('Failed to seed prompts', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <>
      {settingsOpen && (
        <button
          type="button"
          aria-label={language === 'es' ? 'Cerrar ajustes' : 'Close settings'}
          className="absolute inset-0 z-20 bg-black/25 backdrop-blur-[1px] cursor-default"
          onClick={() => setSettingsOpen(false)}
        />
      )}

      <aside
        id="settings-panel"
        aria-hidden={!settingsOpen}
        className={`absolute top-0 right-0 bottom-0 z-30 w-80 max-w-[85vw] border-l border-white/10 bg-[#0a0a0c]/95 backdrop-blur-2xl flex flex-col min-h-0 shadow-2xl transition-transform duration-300 ease-out ${
          settingsOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between shrink-0 px-5 pt-5 pb-4 border-b border-white/5">
          <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-fuchsia-400" />
            {t.settings}
          </h3>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 cursor-pointer"
            aria-label={language === 'es' ? 'Cerrar' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar">
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-fuchsia-400" />
              {t.language}
            </h4>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                  language === 'es' ? 'bg-white/10 text-fuchsia-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                  language === 'en' ? 'bg-white/10 text-fuchsia-400 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <AiProvidersSection />

          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-fuchsia-400" />
              {language === 'es' ? 'OPERACIONES' : 'OPERATIONS'}
            </h4>

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 hover:border-fuchsia-500/30 hover:bg-white/5 p-3 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-white/5 p-2 border border-white/10">
                  <Plus className="w-4 h-4 text-fuchsia-400" />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-200">{t.addPrompt.title}</span>
                  <span className="block text-[10px] text-slate-500">{language === 'es' ? 'Subir archivo o pegar' : 'Upload or paste custom text'}</span>
                </div>
              </div>
            </button>

            {prompts.length === 0 && (
              <button
                type="button"
                onClick={handleSeedData}
                disabled={seeding}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-dashed border-fuchsia-500/30 hover:border-fuchsia-500/60 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 p-3 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-fuchsia-500/10 p-2 border border-fuchsia-500/20">
                    <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-fuchsia-400">{language === 'es' ? 'Sembrar Datos' : 'Seed Sample Prompts'}</span>
                    <span className="block text-[10px] text-slate-400">{language === 'es' ? 'Instalar 3 ejemplos de prompt' : 'Populate with 3 prompt examples'}</span>
                  </div>
                </div>
              </button>
            )}

            {prompts.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider text-slate-500 font-semibold uppercase">
                    {language === 'es' ? `Tus Prompts (${prompts.length})` : `Your Prompts (${prompts.length})`}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(language === 'es' ? '¿Estás seguro de vaciar la base de datos?' : 'Are you sure you want to clear all prompts?')) {
                        await clearDatabase();
                      }
                    }}
                    className="text-[9px] text-rose-400 hover:text-rose-300 font-mono tracking-wider cursor-pointer transition-colors"
                  >
                    {language === 'es' ? 'VACIAR' : 'CLEAR'}
                  </button>
                </div>

                <div className="max-h-[28vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {prompts.map((p) => (
                    <div
                      key={p.id}
                      className="group relative flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.01] hover:border-fuchsia-500/20 hover:bg-white/[0.03] p-2.5 text-left transition-all overflow-hidden"
                    >
                      <div className="flex flex-col truncate min-w-0 flex-grow pr-1">
                        <span className="block text-[9px] font-mono text-fuchsia-400/80 font-bold">#{p.number}</span>
                        <span className="block text-xs font-semibold text-slate-200 truncate" title={p.title}>
                          {p.title || (language === 'es' ? 'Sin Título' : 'Untitled')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          type="button"
                          onClick={() => setEditingPrompt(p)}
                          className="w-6.5 h-6.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400 hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 shrink-0"
                          title={language === 'es' ? 'Editar' : 'Edit'}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(language === 'es' ? `¿Eliminar prompt #${p.number}?` : `Delete prompt #${p.number}?`)) {
                              await deletePrompt(p.id);
                            }
                          }}
                          className="w-6.5 h-6.5 rounded-full bg-rose-500/10 border border-rose-500/20 hover:border-rose-400 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 shrink-0"
                          title={language === 'es' ? 'Eliminar' : 'Delete'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-white/5">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Database Engine</span>
              <span className="text-emerald-400 font-bold">INDEXEDDB</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Cache Connection</span>
              <span className="text-emerald-500">Active</span>
            </div>
          </div>
        </div>
      </aside>

      {addOpen && <AddPromptPopup onClose={() => setAddOpen(false)} />}

      {editingPrompt && (
        <EditPromptPopup prompt={editingPrompt} onClose={() => setEditingPrompt(null)} />
      )}
    </>
  );
}
