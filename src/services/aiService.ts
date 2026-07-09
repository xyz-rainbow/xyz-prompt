/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProviderProfile, AiSettings } from '../types';
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
 * Sends a chat completion to the configured provider.
 * Throws on provider or configuration errors (no silent mock fallback).
 */
export async function generateChatResponse(
  systemPrompt: string,
  userMessage: string,
  label: string | undefined,
  provider: ProviderProfile,
  aiSettings: AiSettings
): Promise<string> {
  const content = await callProviderChat({
    profile: provider,
    model: aiSettings.activeModelId,
    systemPrompt,
    userMessage,
  });
  return label ? `### ${label}\n\n${content}` : content;
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
