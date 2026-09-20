'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/index';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  initialCurrentTime?: number;
  initialCompleted?: boolean;
  onCompleted?: () => void;
}

/**
 * Loads a lesson video, resumes from the last saved position, periodically
 * persists progress to the backend (throttled, not on every timeupdate tick),
 * and lets the student mark the lesson complete. Progress is always saved to
 * the server — never only to localStorage.
 */
export default function VideoPlayer({
  lessonId,
  videoUrl,
  initialCurrentTime = 0,
  initialCompleted = false,
  onCompleted
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const saveProgress = useCallback(
    async (currentTime: number, watchedPercent: number) => {
      try {
        await fetch(`/api/lessons/${lessonId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentTime, watchedPercent })
        });
      } catch {
        // Non-fatal — next timeupdate tick will retry.
      }
    },
    [lessonId]
  );

  // Resume playback position once metadata is loaded.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      if (initialCurrentTime > 0 && initialCurrentTime < video.duration - 1) {
        video.currentTime = initialCurrentTime;
      }
      setRestored(true);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', onLoadedMetadata);
  }, [initialCurrentTime]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const now = video.currentTime;
    // Throttle: only persist roughly every 5 seconds of playback.
    if (Math.abs(now - lastSavedRef.current) >= 5) {
      lastSavedRef.current = now;
      const watchedPercent = Math.min(100, (now / video.duration) * 100);
      saveProgress(now, watchedPercent);
    }
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const watchedPercent = Math.min(100, (video.currentTime / video.duration) * 100);
    lastSavedRef.current = video.currentTime;
    saveProgress(video.currentTime, watchedPercent);
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;
    saveProgress(video.duration, 100);
  };

  const markComplete = async () => {
    setCompleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark lesson complete.');
      setCompleted(true);
      onCompleted?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="h-full w-full"
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
        />
        {!restored && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white/60">
            Restoring your position…
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-cf-charcoal2 px-5 py-4">
        <div className="text-sm text-white/50">
          {completed ? 'You completed this lesson.' : 'Watch the lesson, then mark it complete.'}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-cf-red">{error}</span>}
          <Button
            variant={completed ? 'outline' : 'gold'}
            className="!px-4 !py-2 text-xs"
            disabled={completed}
            loading={completing}
            onClick={markComplete}
          >
            {completed ? 'Completed ✓' : 'Mark Lesson Complete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
