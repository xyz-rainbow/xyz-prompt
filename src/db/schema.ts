/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { type Table } from 'dexie';
import { Prompt, Vote, Feedback, ProviderProfile, AiSettings } from '../types';

export class PromptRatingDatabase extends Dexie {
  prompts!: Table<Prompt, string>;
  votes!: Table<Vote, string>;
  feedbacks!: Table<Feedback, string>;
  providers!: Table<ProviderProfile, string>;
  aiSettings!: Table<AiSettings, string>;

  constructor() {
    super('PromptRatingDatabase');
    this.version(1).stores({
      prompts: 'id, number, title, source, createdAt',
      votes: 'id, promptId, type, mode, createdAt',
      feedbacks: 'id, promptId, mode, createdAt, byAi',
    });
    this.version(2).stores({
      prompts: 'id, number, title, source, createdAt',
      votes: 'id, promptId, type, mode, createdAt',
      feedbacks: 'id, promptId, mode, createdAt, byAi',
      providers: 'id, label, enabled, builtin',
      aiSettings: 'id',
    });
  }
}

export const db = new PromptRatingDatabase();
