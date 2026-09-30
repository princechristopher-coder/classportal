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

  // Resume playback position once the video can actually play.
  //
  // We used to seek on 'loadedmetadata', but jumping ahead before any video
  // data is buffered can make some hosts/browsers (especially on mobile)
  // stall forever trying to fetch that range — the video looks like it will
  // never play. Waiting for 'canplay', wrapping the seek in try/catch, and
  // giving up after a few seconds keeps a bad resume from blocking playback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setRestored(true);
      clearTimeout(giveUpTimer);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', finish);
    };

    const attemptSeek = () => {
      if (initialCurrentTime > 1 && video.duration && initialCurrentTime < video.duration - 1) {
        try {
          video.currentTime = initialCurrentTime;
        } catch {
          // Seeking isn't possible yet (or this host doesn't support it well) —
          // just play from the start instead of getting stuck.
        }
      }
    };

    const onCanPlay = () => {
      attemptSeek();
      finish();
    };

    // Safety net: never leave the player stuck waiting to resume.
    const giveUpTimer = setTimeout(finish, 6000);

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', finish);

    // Already buffered enough by the time this effect ran (e.g. fast connection)?
    if (video.readyState >= 3) onCanPlay();

    return () => {
      clearTimeout(giveUpTimer);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', finish);
    };
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
