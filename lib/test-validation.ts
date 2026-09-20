import { z } from 'zod';
import { LETTERS } from './tests';

const isoOrNull = z.union([z.string().datetime(), z.null()]).optional();

export const testBaseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.'),
  description: z.string().trim().optional().nullable(),
  durationMins: z.number().int().min(1, 'Duration must be at least 1 minute.').max(600, 'Duration is too long (max 600 minutes).'),
  maxAttempts: z.number().int().min(1, 'Allow at least 1 attempt.').max(20),
  passMark: z.number().int().min(0).max(100, 'Pass mark is a percentage from 0 to 100.'),
  showReview: z.boolean(),
  published: z.boolean().optional(),
  opensAt: isoOrNull,
  closesAt: isoOrNull
});

export function windowIsValid(opensAt?: string | null, closesAt?: string | null) {
  return !opensAt || !closesAt || new Date(closesAt) > new Date(opensAt);
}

export const testSchema = testBaseSchema.refine((d) => windowIsValid(d.opensAt, d.closesAt), {
  message: 'Closing time must be after the opening time.',
  path: ['closesAt']
});

export const testPatchSchema = testBaseSchema.partial();

export function toDateOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(value);
}

export const questionSchema = z
  .object({
    topic: z.string().trim().max(80).optional().nullable(),
    text: z.string().trim().min(3, 'Write the question.').max(3000),
    options: z
      .array(z.string().trim().min(1, 'Options cannot be empty.').max(1000))
      .min(2, 'Add at least 2 options.')
      .max(6, 'At most 6 options.'),
    correctIndex: z.number().int().min(0),
    explanation: z.string().trim().max(3000).optional().nullable()
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: 'Pick which option is correct.',
    path: ['correctIndex']
  });

export type QuestionInput = z.infer<typeof questionSchema>;

export class ImportError extends Error {}

function firstString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/**
 * Accepts a JSON list of questions with forgiving key names and returns clean
 * question inputs, or throws an ImportError that says exactly which question is wrong.
 *   { "question": "...", "options": ["..", ".."], "answer": "B", "topic": "..", "explanation": ".." }
 */
export function normalizeImportedQuestions(raw: unknown): QuestionInput[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { questions?: unknown }).questions)
    ? (raw as { questions: unknown[] }).questions
    : null;

  if (!list) throw new ImportError('Expected a JSON list of questions, like [ { "question": "...", "options": [...], "answer": "A" } ].');
  if (list.length === 0) throw new ImportError('The list is empty.');
  if (list.length > 300) throw new ImportError('Too many questions in one import (max 300).');

  return list.map((item, i) => {
    const n = i + 1;
    if (!item || typeof item !== 'object') throw new ImportError(`Question ${n}: not a valid question object.`);
    const o = item as Record<string, unknown>;

    const text = firstString(o.question, o.text, o.q);
    if (!text) throw new ImportError(`Question ${n}: missing "question" text.`);

    const optionsRaw = o.options ?? o.choices;
    if (!Array.isArray(optionsRaw) || optionsRaw.length < 2 || optionsRaw.length > 6) {
      throw new ImportError(`Question ${n}: "options" must be a list of 2 to 6 choices.`);
    }
    const options = optionsRaw.map((x) => String(x).trim());
    if (options.some((x) => !x)) throw new ImportError(`Question ${n}: an option is empty.`);

    let correctIndex = -1;
    if (typeof o.correctIndex === 'number') {
      correctIndex = o.correctIndex;
    } else if (typeof o.answer === 'string') {
      const a = o.answer.trim();
      correctIndex = /^[A-Fa-f]$/.test(a)
        ? a.toUpperCase().charCodeAt(0) - 65
        : options.findIndex((x) => x.toLowerCase() === a.toLowerCase());
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      throw new ImportError(
        `Question ${n}: "answer" must be a letter A–${LETTERS[options.length - 1]} that matches one of its options.`
      );
    }

    return questionSchema.parse({
      topic: firstString(o.topic) || null,
      text,
      options,
      correctIndex,
      explanation: firstString(o.explanation, o.note) || null
    });
  });
}
