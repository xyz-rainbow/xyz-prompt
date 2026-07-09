/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Sparkles, Plus, Trash2, Pencil } from 'lucide-react';
import { useStore } from '../../store/useStore';
import AddPromptPopup from './AddPromptPopup';
import EditPromptPopup from './EditPromptPopup';
import { Prompt } from '../../types';

type Accent = 'fuchsia' | 'indigo';

interface PromptOperationsSectionProps {
  accent?: Accent;
  onBeforeAction?: () => void;
}

const ACCENT_STYLES: Record<
  Accent,
  {
    icon: string;
    addHover: string;
    seedBorder: string;
    seedBg: string;
    seedIconBg: string;
    seedText: string;
    listHover: string;
    promptNumber: string;
    editBtn: string;
  }
> = {
  fuchsia: {
    icon: 'text-fuchsia-400',
    addHover: 'hover:border-fuchsia-500/30',
    seedBorder: 'border-dashed border-fuchsia-500/30 hover:border-fuchsia-500/60 bg-fuchsia-500/5 hover:bg-fuchsia-500/10',
    seedBg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
    seedText: 'text-fuchsia-400',
    listHover: 'hover:border-fuchsia-500/20',
    promptNumber: 'text-fuchsia-400/80',
    editBtn: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-400 hover:bg-indigo-500/20 text-indigo-400',
  },
  indigo: {
    icon: 'text-indigo-400',
    addHover: 'hover:border-indigo-500/30',
    seedBorder: 'border-dashed border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5 hover:bg-indigo-500/10',
    seedBg: 'bg-indigo-500/10 border-indigo-500/20',
    seedText: 'text-indigo-400',
    listHover: 'hover:border-indigo-500/20',
    promptNumber: 'text-indigo-400/80',
    editBtn: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-400 hover:bg-indigo-500/20 text-indigo-400',
  },
};

export default function PromptOperationsSection({
  accent = 'fuchsia',
  onBeforeAction,
}: PromptOperationsSectionProps) {
  const language = useStore((state) => state.language);
  const t = useStore((state) => state.t());

  const prompts = useStore((state) => state.prompts);
  const addPrompt = useStore((state) => state.addPrompt);
  const deletePrompt = useStore((state) => state.deletePrompt);
  const clearDatabase = useStore((state) => state.clearDatabase);

  const [addOpen, setAddOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const styles = ACCENT_STYLES[accent];

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await addPrompt(
        language === 'es' ? 'Asistente de Escritura Creativa' : 'Creative Writing Assistant',
        `Act as an expert developmental editor and novelist. Your task is to critique and polish the following chapter snippet.\n\n## Guidelines\n- Evaluate pacing, character voice, and narrative tension.\n- Provide exactly three actionable editing suggestions.\n- Rewrite a selected sentence in two distinct styles (e.g., lyrical and minimalist).\n\n## Rules\n- Output in clean Markdown.\n- Do NOT include intro or outro conversational filler.\n\n## Snippet Data\n\`\`\`\n{{draft_snippet}}\n\`\`\`\n\n## Detailed Critique`,
        'seed',
      );

      await addPrompt(
        language === 'es' ? 'Refactorizador de Código TS' : 'TS Code Refactoring Coach',
        `You are a staff engineer specialized in clean code, performance, and modern TypeScript patterns.\n\n## Goal\nAnalyze the provided typescript snippet for performance leaks, redundant calculations, and type safety issues.\n\n## Constraints\n- Output format: Markdown with split codeblocks (Before and After).\n- Keep explanations brief and technical.\n- Highlight potential edge cases or bugs.\n\n## Snippet\n\`\`\`typescript\n{{code_to_refactor}}\n\`\`\`\n\n## Refactored TypeScript Output`,
        'seed',
      );

      await addPrompt(
        language === 'es' ? 'Copywriter Persuasivo AIDA' : 'AIDA Persuasive Copywriter',
        `Act as an elite copywriter trained in behavioral psychology. Your role is to write a highly converting product launch copy based on the description below.\n\nApply the AIDA Framework (Attention, Interest, Desire, Action):\n- **Attention**: Hook the audience with a bold, eye-opening headline.\n- **Interest**: Address a core pain point and introduce the solution.\n- **Desire**: Illustrate premium emotional and functional benefits.\n- **Action**: Add a clear, friction-free CTA.\n\nProduct/Service Details:\n{{product_description}}\n\nTarget Persona: {{target_persona}}\n\nConversion Copy Output`,
        'seed',
      );
    } catch (err) {
      console.error('Failed to seed prompts', err);
    } finally {
      setSeeding(false);
    }
  };

  const openAdd = () => {
    onBeforeAction?.();
    setAddOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        <h4 className="text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
          <Database className={`w-3.5 h-3.5 ${styles.icon}`} />
          {language === 'es' ? 'OPERACIONES' : 'OPERATIONS'}
        </h4>

        <button
          type="button"
          onClick={openAdd}
          className={`w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 ${styles.addHover} hover:bg-white/5 p-3 text-left transition-all cursor-pointer group`}
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/5 p-2 border border-white/10">
              <Plus className={`w-4 h-4 ${styles.icon}`} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-200">{t.addPrompt.title}</span>
              <span className="block text-[10px] text-slate-500">
                {language === 'es' ? 'Subir archivo o pegar' : 'Upload or paste custom text'}
              </span>
            </div>
          </div>
        </button>

        {prompts.length === 0 && (
          <button
            type="button"
            onClick={() => {
              onBeforeAction?.();
              void handleSeedData();
            }}
            disabled={seeding}
            className={`w-full flex items-center justify-between gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer ${styles.seedBorder}`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`rounded-lg p-2 border ${styles.seedBg}`}>
                <Sparkles className={`w-4 h-4 ${styles.seedText} animate-pulse`} />
              </div>
              <div>
                <span className={`block text-xs font-semibold ${styles.seedText}`}>
                  {language === 'es' ? 'Sembrar Datos' : 'Seed Sample Prompts'}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {language === 'es' ? 'Instalar 3 ejemplos de prompt' : 'Populate with 3 prompt examples'}
                </span>
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
                  onBeforeAction?.();
                  if (
                    confirm(
                      language === 'es'
                        ? '¿Estás seguro de vaciar la base de datos?'
                        : 'Are you sure you want to clear all prompts?',
                    )
                  ) {
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
                  className={`group relative flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.01] ${styles.listHover} hover:bg-white/[0.03] p-2.5 text-left transition-all overflow-hidden`}
                >
                  <div className="flex flex-col truncate min-w-0 flex-grow pr-1">
                    <span className={`block text-[9px] font-mono font-bold ${styles.promptNumber}`}>#{p.number}</span>
                    <span className="block text-xs font-semibold text-slate-200 truncate" title={p.title}>
                      {p.title || (language === 'es' ? 'Sin Título' : 'Untitled')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      type="button"
                      onClick={() => {
                        onBeforeAction?.();
                        setEditingPrompt(p);
                      }}
                      className={`w-6.5 h-6.5 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 shrink-0 ${styles.editBtn}`}
                      title={language === 'es' ? 'Editar' : 'Edit'}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        onBeforeAction?.();
                        if (
                          confirm(
                            language === 'es'
                              ? `¿Eliminar prompt #${p.number}?`
                              : `Delete prompt #${p.number}?`,
                          )
                        ) {
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

      {addOpen && <AddPromptPopup onClose={() => setAddOpen(false)} />}
      {editingPrompt && (
        <EditPromptPopup prompt={editingPrompt} onClose={() => setEditingPrompt(null)} />
      )}
    </>
  );
}
