// Data contracts shared by the teacher dashboard, the student player and the server.
// A "game document" (GameDoc) is everything a teacher can customise. The engine and the
// templates only ever read a GameDoc — they never hard-code subject content.
import { z } from 'zod';

export const QUESTION_TYPES = ['mcq', 'tf', 'short', 'order'] as const;
export const TEMPLATE_IDS = ['stars', 'maze', 'gates'] as const;
export const THEME_IDS = ['emerald', 'royal', 'sand', 'night', 'violet'] as const;
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];
export type TemplateId = (typeof TEMPLATE_IDS)[number];
export type ThemeId = (typeof THEME_IDS)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

const idField = z.string().min(1).max(40);
const assetRef = z.string().max(40).nullable();
const str = (max: number) => z.string().max(max);

export const OptionSchema = z.object({ id: idField, text: str(200) });

const questionBase = {
  id: idField,
  prompt: str(500),
  imageId: assetRef,
  hint: str(300),
  explanation: str(600),
  concept: str(60),
};

export const McqQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('mcq'),
  options: z.array(OptionSchema).min(2).max(6),
  correctId: str(40),
});
export const TfQuestionSchema = z.object({ ...questionBase, type: z.literal('tf'), answer: z.boolean() });
export const ShortQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('short'),
  accepted: z.array(str(120)).max(10),
});
// `items` are stored in the correct order; the player shuffles them.
export const OrderQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('order'),
  items: z.array(OptionSchema).max(8),
});

export const QuestionSchema = z.discriminatedUnion('type', [
  McqQuestionSchema,
  TfQuestionSchema,
  ShortQuestionSchema,
  OrderQuestionSchema,
]);

export const MetaSchema = z.object({
  title: str(80),
  subject: str(40),
  grade: str(40),
  term: str(40),
  lesson: str(120),
  objectives: z.array(str(200)).max(6),
  description: str(400),
  teacherName: str(80),
  schoolName: str(80),
  logoId: assetRef,
  coverId: assetRef,
});

export const SettingsSchema = z.object({
  difficulty: z.enum(DIFFICULTIES),
  questionCount: z.number().int().min(0).max(100), // 0 = all questions
  order: z.enum(['fixed', 'random']),
  shuffleOptions: z.boolean(),
  triesPerQuestion: z.number().int().min(1).max(3),
  pointsPerQuestion: z.number().int().min(1).max(100),
  hints: z.enum(['off', 'free', 'penalty']),
  timerEnabled: z.boolean(),
  timerMinutes: z.number().int().min(1).max(90),
  showCorrectAnswer: z.boolean(),
  showExplanation: z.boolean(),
  correctMessage: str(120),
  wrongMessage: str(120),
  allowReplay: z.boolean(),
  sound: z.boolean(),
  theme: z.enum(THEME_IDS),
  address: z.enum(['f', 'm']),
  welcomeMessage: str(400),
  completionMessage: str(400),
  recordResults: z.boolean(),
  askPlayerName: z.boolean(),
});

export const GameDocSchema = z.object({
  schemaVersion: z.literal(1),
  templateId: z.enum(TEMPLATE_IDS),
  meta: MetaSchema,
  questions: z.array(QuestionSchema).max(100),
  settings: SettingsSchema,
});

export type Option = z.infer<typeof OptionSchema>;
export type McqQuestion = z.infer<typeof McqQuestionSchema>;
export type TfQuestion = z.infer<typeof TfQuestionSchema>;
export type ShortQuestion = z.infer<typeof ShortQuestionSchema>;
export type OrderQuestion = z.infer<typeof OrderQuestionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type GameMeta = z.infer<typeof MetaSchema>;
export type GameSettings = z.infer<typeof SettingsSchema>;
export type GameDoc = z.infer<typeof GameDocSchema>;

// One answered question inside a student attempt.
export const AnswerRecordSchema = z.object({
  qid: idField,
  correct: z.boolean(),
  tries: z.number().int().min(0).max(3),
  usedHint: z.boolean(),
});
export type AnswerRecord = z.infer<typeof AnswerRecordSchema>;

export const AttemptPayloadSchema = z.object({
  version: z.number().int().min(1),
  player: str(40),
  outcome: z.enum(['completed', 'timeout']),
  durationSec: z.number().int().min(0).max(6 * 3600),
  answers: z.array(AnswerRecordSchema).max(100),
});
export type AttemptPayload = z.infer<typeof AttemptPayloadSchema>;

// ---- API shapes -------------------------------------------------------------------------

export interface GameSummary {
  id: string;
  title: string;
  subject: string;
  grade: string;
  templateId: TemplateId;
  theme: ThemeId;
  questionCount: number;
  status: GameStatus;
  updatedAt: string;
  publishedAt: string | null;
  attemptCount: number;
}

// draft: never published · live: published and identical to the draft ·
// changed: published but the draft has unpublished edits · paused: was published, then stopped
export type GameStatus = 'draft' | 'live' | 'changed' | 'paused';

export interface GameRecord {
  id: string;
  draft: GameDoc;
  revision: number;
  status: GameStatus;
  isPublished: boolean;
  publishedVersion: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface PlayPayload {
  id: string;
  version: number;
  doc: GameDoc;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}
