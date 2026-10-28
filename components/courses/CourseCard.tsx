import Link from 'next/link';
import { Badge } from '@/components/ui/index';
import type { CourseSummary } from '@/components/courses/CourseGrid';

const levelTone: Record<string, 'gold' | 'red' | 'green'> = {
  BEGINNER: 'green',
  INTERMEDIATE: 'gold',
  ADVANCED: 'red'
};

export default function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="glass group overflow-hidden rounded-[24px] p-3 transition hover:border-cf-gold/40 hover:shadow-goldGlow"
    >
      <div className="relative aspect-video overflow-hidden rounded-[18px] border border-white/20 bg-gradient-to-br from-[#59e3ea] via-[#3b6fe0] to-[#241a6b]">
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-white/30">
            CF
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-cf-black/70 backdrop-blur-md">
          <Badge tone={levelTone[course.level]}>{course.level}</Badge>
        </div>
      </div>
      <div className="p-3 pt-4">
        <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-cf-gold">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-white/50">{course.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-white/40">
          <span>{course._count.lessons} lessons</span>
          <span>{course._count.enrollments} enrolled</span>
        </div>
        <div className="mt-4 border-t border-white/10 pt-4 text-sm font-semibold text-cf-gold">
          {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}
        </div>
      </div>
    </Link>
  );
}
