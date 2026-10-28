'use client';

import { Badge, ProgressBar } from '@/components/ui/index';

export interface LessonSummary {
  id: string;
  title: string;
  duration: number;
  isFree: boolean;
  quizUrl?: string | null;
  order: number;
}

export interface LessonProgressMap {
  [lessonId: string]: { currentTime: number; watchedPercent: number; completed: boolean };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LessonList({
  lessons,
  activeLessonId,
  progressByLesson,
  hasAccess,
  onSelect
}: {
  lessons: LessonSummary[];
  activeLessonId: string | null;
  progressByLesson: LessonProgressMap;
  hasAccess: boolean;
  onSelect: (lessonId: string) => void;
}) {
  const completedCount = lessons.filter((l) => progressByLesson[l.id]?.completed).length;
  const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="glass rounded-[28px] p-5">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-white/80">Course Progress</span>
          <span className="text-cf-gold">{percent}%</span>
        </div>
        <ProgressBar value={percent} />
        {percent === 100 && (
          <p className="mt-2 text-xs font-medium text-emerald-400">Course Completed — Certificate Available</p>
        )}
      </div>

      <ul className="space-y-1">
        {lessons.map((lesson, i) => {
          const locked = !hasAccess && !lesson.isFree;
          const progress = progressByLesson[lesson.id];
          const isActive = activeLessonId === lesson.id;

          return (
            <li key={lesson.id}>
              <button
                disabled={locked}
                onClick={() => onSelect(lesson.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-[15px] px-3 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? 'border border-cf-gold/35 bg-gradient-to-br from-cf-gold/20 to-cf-violet/20 text-white'
                    : locked
                      ? 'cursor-not-allowed text-white/30'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      progress?.completed
                        ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400'
                        : isActive
                        ? 'border-transparent bg-cf-gold text-[#061029]'
                        : 'border-white/20 text-white/50'
                    }`}
                  >
                    {progress?.completed ? '✓' : i + 1}
                  </span>
                  <span className="line-clamp-1">{lesson.title}</span>
                  {lesson.isFree && <Badge tone="green">Free</Badge>}
                  {lesson.quizUrl && <span title="Has a quiz" className="text-xs">📝</span>}
                </span>
                <span className="shrink-0 text-xs text-white/40">
                  {locked ? '🔒' : formatDuration(lesson.duration)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
