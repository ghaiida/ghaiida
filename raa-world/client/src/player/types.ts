import type { PlayQuestion } from '../../../shared/engine.ts';
import type { GameDoc } from '../../../shared/schema.ts';
import type { Sfx } from './sound.ts';
import type { Words } from './words.ts';

export interface AskOptions {
  label: string; // e.g. "غابة الأسرار · سؤال ٢ من ٣"
  variant: 'stars' | 'maze' | 'gates';
  placement?: 'center' | 'side';
  practice?: boolean; // re-asked for learning; not recorded
  onTry?: (correct: boolean) => void; // fires after every check, so templates can react live
}

export interface AskResult {
  correct: boolean;
  tries: number;
  usedHint: boolean;
  revealed: boolean; // tries ran out
}

export interface TemplateProps {
  round: PlayQuestion[];
  doc: GameDoc;
  ask: (pq: PlayQuestion, opts: AskOptions) => Promise<AskResult>;
  sfx: Sfx;
  words: Words;
  reducedMotion: boolean;
  onComplete: (achievement: string) => void;
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
