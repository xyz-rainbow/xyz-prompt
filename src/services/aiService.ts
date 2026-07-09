/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProviderProfile, AiSettings } from '../types';
import { isProfileConfigured } from '../lib/providers/provider-profile';
import { callProviderChat } from './providerApi';

export interface AiEvaluationResult {
  score: number; // 0 to 100
  strengths: string[];
  weaknesses: string[];
  suggestions: string; // Restructured prompt text recommendation
  suggestedFeedback: string;
}

/**
 * Analyzes the prompt content using advanced prompt engineering heuristic rules,
 * returning high-fidelity, customized feedback, scores, and an optimized prompt version.
 */
export async function evaluatePromptWithAi(content: string): Promise<AiEvaluationResult> {
  // Simulate network latency for realism
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const trimmed = content.trim();
  if (!trimmed) {
    return {
      score: 0,
      strengths: ["None detected."],
      weaknesses: ["The prompt is completely empty."],
      suggestions: "Please write some prompt text before running an AI audit.",
      suggestedFeedback: "The prompt is empty and cannot be evaluated."
    };
  }

  // Feature detection
  const lower = trimmed.toLowerCase();
  
  // 1. Role play / Persona definition
  const hasRole = /\b(you are|act as|as an? \w+|role\b|persona\b|expert\b|specialist\b)/.test(lower);
  
  // 2. Few-shot examples
  const hasExamples = /\b(example|few-shot|sample|instance|here is an?|e\.g\.)/.test(lower);
  
  // 3. Placeholders or input variables
  const hasVariables = /(\{\{[\w\s_-]+\}\}|\[[\w\s_-]+\]|<[\w\s_-]+>|\{[\w\s_-]+\})/.test(trimmed);
  
  // 4. Output formatting constraints
  const hasFormat = /\b(json|xml|markdown|csv|bullet list|numbered|format\b|structure\b|output\b)/.test(lower);
  
  // 5. Delimiters to protect prompt injection / structure
  const hasDelimiters = /(""\"|```|---|###|===|\[\[|\]\])/.test(trimmed);
  
  // 6. Negative constraints (what not to do)
  const hasNegativeConstraints = /\b(don't|do not|never|avoid|without\b|no\s+\w+)/.test(lower);

  // 7. Chain of Thought / Reasoning step
  const hasCot = /\b(think step|step-by-step|reasoning|explain your\b|let's think\b)/.test(lower);

  // Analyze word count and structure density
  const wordCount = trimmed.split(/\s+/).length;
  const isTooShort = wordCount < 15;
  const isSuperLong = wordCount > 300;

  // Compute scoring
  let score = 40; // Base score
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Check Role
  if (hasRole) {
    score += 10;
    strengths.push("Defining a clear system role or expert persona establishes consistent instruction tone and capability limits.");
  } else {
    weaknesses.push("Missing clear persona assignment. Adding e.g., 'Act as an expert technical editor...' focuses model behavior.");
  }

  // Check Variables
  if (hasVariables) {
    score += 10;
    strengths.push("Utilizing placeholders/variables (e.g. {{variable}}) makes this template reusable and highly modular.");
  } else {
    weaknesses.push("Missing template variables. Hardcoded data limits reusability. Consider adding [input_text] or {{data}} placeholders.");
  }

  // Check Format Constraints
  if (hasFormat) {
    score += 10;
    strengths.push("Explicitly specifies target output format (JSON, Markdown, Bullets) which increases parsing reliability.");
  } else {
    weaknesses.push("No explicit output format specified. Directing the model to output structured JSON or list format improves validation.");
  }

  // Check Delimiters
  if (hasDelimiters) {
    score += 10;
    strengths.push("Applies structural delimiters (e.g. triple backticks or dashes) to isolate input variables, preventing context injection.");
  } else {
    weaknesses.push("Missing structural boundary delimiters. Wrapping dynamic variables inside triple backticks ```[input]``` protects the instructions.");
  }

  // Check Few-Shot Examples
  if (hasExamples) {
    score += 10;
    strengths.push("Includes few-shot examples. Providing input-output matches is highly effective for complex instruction formatting.");
  } else {
    weaknesses.push("No input-output examples found. Adding at least one 'Input: ... -> Output: ...' pair establishes expected quality patterns.");
  }

  // Check COT or Negative constraints
  if (hasCot) {
    score += 5;
    strengths.push("Asks the model to think step-by-step or reason before outputting, activating Chain-of-Thought (CoT) logic.");
  }
  if (hasNegativeConstraints) {
    score += 5;
    strengths.push("Explicitly declares negative boundaries (e.g. 'do not...'), limiting hallucination rates.");
  }

  // Check Length
  if (isTooShort) {
    score -= 15;
    weaknesses.push("Extremely brief prompt text. Brief instruction lines lack specific context and guidelines, leading to generic outputs.");
  } else if (isSuperLong) {
    score += 5;
    strengths.push("Rich and detailed contextual guidelines provide substantial grounding to guide generative outcomes.");
  }

  // Bound score
  score = Math.min(100, Math.max(10, score));

  // Generate dynamic recommendation
  let suggestions = "";
  if (isTooShort) {
    suggestions = `# Recommended Prompt Structure\n\nAct as a [PERSONA EXPERT].\n\n## Goal\nYour task is to [CLEAR DIRECTIVE] based on the input text provided below.\n\n## Constraints\n- Output format: [e.g. Markdown / JSON]\n- Style and Tone: [e.g. Professional, Concise]\n- Do NOT include [NEGATIVE CONSTRAINT]\n\n## Inputs\nUse triple backticks to frame the data:\n\`\`\`\n{{input_data}}\n\`\`\``;
  } else {
    // Generate restructured prompt based on actual text
    const guessedPersona = hasRole ? "Expert assistant" : "Specialist Consultant";
    const cleanContent = trimmed.slice(0, 150) + (trimmed.length > 150 ? "..." : "");
    
    suggestions = `# System Persona\nAct as a highly-skilled ${guessedPersona} specializing in optimizing generative tasks.\n\n# Core Objective\nRefine, filter, and execute the following task with premium fidelity:\n> ${cleanContent}\n\n# Structural Guidelines & Constraints\n1. **Structured Format**: Provide the output in clean ${hasFormat ? 'Structured' : 'Markdown'} format.\n2. **Isolate Dynamic Content**: Wrap all variable inputs inside structured delimiters to prevent context bleeding.\n3. **Negative Constraint**: Do not output introductory conversational fillers or wrap-up chit-chat.\n\n# Execution Data\n\`\`\`\n{{input_data}}\n\`\`\`\n\n# Output`;
  }

  // Generate suggested feedback
  let suggestedFeedback = "";
  if (score >= 85) {
    suggestedFeedback = `This is a premium, robust prompt template! It scores ${score}/100. It covers role assignment, formatting rules, and dynamic placeholders perfectly. To push it to 100%, consider adding a 1-shot example of the ideal output block.`;
  } else if (score >= 65) {
    suggestedFeedback = `Solid prompt outline scoring ${score}/100. It has some great structures, but would benefit significantly from explicit delimiters around template inputs to safeguard against instructions override.`;
  } else {
    suggestedFeedback = `This prompt (Score: ${score}/100) is highly direct but lacks system instructions, persona anchoring, and variables. Adding formatting constraints and isolating input data would make it vastly more reliable in production.`;
  }

  return {
    score,
    strengths,
    weaknesses,
    suggestions,
    suggestedFeedback
  };
}

/**
 * Simulates a model response using the system prompt and user message.
 * Uses configured provider when available; falls back to mock.
 */
export async function generateChatResponse(
  systemPrompt: string,
  userMessage: string,
  label?: string,
  provider?: ProviderProfile | null,
  aiSettings?: AiSettings
): Promise<string> {
  const useReal =
    provider &&
    aiSettings &&
    !aiSettings.preferMock &&
    isProfileConfigured(provider) &&
    aiSettings.activeModelId;

  if (useReal) {
    try {
      const content = await callProviderChat({
        profile: provider,
        model: aiSettings.activeModelId,
        systemPrompt,
        userMessage,
      });
      return label ? `### ${label}\n\n${content}` : content;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Provider error';
      return `### Provider error${label ? ` [${label}]` : ''}\n\n${msg}\n\n_Falling back to simulated response._\n\n${await mockChatResponse(systemPrompt, userMessage, label)}`;
    }
  }

  return mockChatResponse(systemPrompt, userMessage, label);
}

async function mockChatResponse(
  systemPrompt: string,
  userMessage: string,
  label?: string
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const lower = systemPrompt.toLowerCase();
  const tag = label ? ` [${label}]` : '';

  if (lower.includes('editor') || lower.includes('novel')) {
    return `### Simulated Response${tag}\n\n**Developmental Review**\n- *Pacing*: Strong hook; tension could build more before the reveal.\n- *Voice*: Prose fits the narrator's tone.\n\n**Suggestions:**\n1. Replace passive descriptors with sensory actions.\n2. Deepen inner monologue.\n3. Keep the cliffhanger focused.\n\n_User input processed:_ "${userMessage.slice(0, 80)}${userMessage.length > 80 ? '...' : ''}"`;
  }
  if (lower.includes('code') || lower.includes('typescript')) {
    return `### Simulated Response${tag}\n\n**Code Review**\n\n\`\`\`typescript\n// Optimized snippet based on system prompt\nexport function processInput<T extends { id: string }>(items: T[]) {\n  return new Map(items.map((it, idx) => [it.id, idx]));\n}\n\`\`\`\n\n_Input:_ "${userMessage.slice(0, 60)}..."`;
  }
  if (lower.includes('marketing') || lower.includes('copy')) {
    return `### Simulated Response${tag}\n\n**AIDA Copy Draft**\n\n- **ATTENTION**: Bold headline addressing the core pain point.\n- **INTEREST**: Solution intro tied to user context.\n- **DESIRE**: Benefits aligned with the request.\n- **ACTION**: Clear CTA.\n\n_Brief:_ "${userMessage.slice(0, 80)}..."`;
  }

  const persona = /\b(you are|act as)\b/i.test(systemPrompt) ? 'Expert assistant' : 'General assistant';
  return `### Simulated Response${tag}\n\n**${persona}** processed your message following the active system prompt.\n\n1. **Alignment**: Core objectives understood.\n2. **Tone**: Professional and structured.\n3. **Output**: Formatted per prompt constraints.\n\n**Reply to:** "${userMessage}"`;
}

export async function generateAutofillFeedback(promptTitle: string, promptContent: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const wordCount = promptContent.trim().split(/\s+/).length;
  
  if (wordCount < 10) {
    return `The instruction is extremely brief. I recommend expanding it with an expert persona and structural constraints.`;
  }

  const matches = promptContent.match(/(\{\{[\w\s_-]+\}\}|\[[\w\s_-]+\]|<[\w\s_-]+>)/);
  if (!matches) {
    return `Great draft for a static prompt! Adding dynamic input variables like '{{text}}' would make this a highly reusable template for API integrations.`;
  }

  return `Excellent reusable prompt template! The variables are defined clearly. Adding a sample output example inside the prompt would establish perfect formatting consistency.`;
}
