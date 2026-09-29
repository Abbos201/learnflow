'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

type Props = {
  src: string;
  lessonId: string;
  initialWatched: number;
  alreadyCompleted: boolean;
  knownDuration: number | null;
  onPercent: (pct: number) => void;
  onCompleted: () => void;
  onError: (message: string) => void;
};

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export default function VideoPlayer({ src, lessonId, initialWatched, alreadyCompleted, knownDuration, onPercent, onCompleted, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Furthest point reached by actually playing (never by skipping). Persisted as watched_seconds.
  const maxWatched = useRef(initialWatched);
  const durationRef = useRef(knownDuration ?? 0);
  const doneRef = useRef(alreadyCompleted); // once completed, seeking is unrestricted
  const lastSent = useRef(0);
  const lastPct = useRef(-1);
  const callbacks = useRef({ onPercent, onCompleted, onError });
  callbacks.current = { onPercent, onCompleted, onError };

  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(knownDuration ?? 0);
  const [furthest, setFurthest] = useState(alreadyCompleted ? knownDuration ?? 0 : initialWatched);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [failed, setFailed] = useState(false);

  const buildPayload = useCallback(
    (ended: boolean) => {
      const d = durationRef.current;
      if (!d || !isFinite(d)) return null;
      return { lessonId, watchedSeconds: Math.min(maxWatched.current, d), duration: d, ended };
    },
    [lessonId]
  );

  const save = useCallback(
    async (ended = false) => {
      if (doneRef.current) return;
      const body = buildPayload(ended);
      if (!body || (!ended && body.watchedSeconds <= 0)) return;
      lastSent.current = Date.now();
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: true,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (ended) callbacks.current.onError(data?.error ?? 'Could not save your progress.');
          return;
        }
        if (data?.completed) {
          doneRef.current = true;
          callbacks.current.onPercent(100);
          callbacks.current.onCompleted();
        } else if (ended) {
          callbacks.current.onError(data?.error ?? 'Please watch the whole lesson to complete it.');
        }
      } catch {
        if (ended) callbacks.current.onError('Network error. Your progress could not be saved.');
      }
    },
    [buildPayload]
  );

  // Save the latest position when the student leaves the page or switches tabs.
  useEffect(() => {
    const beacon = () => {
      if (doneRef.current) return;
      const body = buildPayload(false);
      if (!body || body.watchedSeconds <= 0) return;
      navigator.sendBeacon('/api/progress', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    };
    const onHide = () => document.visibilityState === 'hidden' && beacon();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', beacon);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', beacon);
      beacon(); // unmount (in-app navigation)
    };
  }, [buildPayload]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  function handleLoadedMetadata() {
    const v = videoRef.current!;
    durationRef.current = v.duration;
    setDuration(v.duration);
    setBuffering(false);
    if (doneRef.current) {
      setFurthest(v.duration);
    } else if (initialWatched > 5) {
      v.currentTime = Math.max(0, Math.min(initialWatched - 3, v.duration - 1)); // resume, rewinding 3s for context
    }
  }

  function handleTimeUpdate() {
    const v = videoRef.current!;
    const t = v.currentTime;
    if (!doneRef.current) {
      if (t > maxWatched.current + 1.5) {
        v.currentTime = maxWatched.current; // skipped ahead: snap back
        return;
      }
      if (t > maxWatched.current) maxWatched.current = t;
      setFurthest(maxWatched.current);
      const d = durationRef.current;
      if (d > 0) {
        const pct = Math.min(99, Math.floor((maxWatched.current / d) * 100));
        if (pct !== lastPct.current) {
          lastPct.current = pct;
          callbacks.current.onPercent(pct);
        }
      }
      if (!v.paused && Date.now() - lastSent.current > 15000) void save(false); // throttled: one request per ~15s
    }
    setTime(t);
  }

  function handleSeeking() {
    const v = videoRef.current!;
    if (!doneRef.current && v.currentTime > maxWatched.current + 1) v.currentTime = maxWatched.current;
  }

  function handleEnded() {
    setPlaying(false);
    if (!doneRef.current) {
      const d = durationRef.current;
      if (d > 0 && maxWatched.current > d - 3) maxWatched.current = d; // natural end reached
      void save(true);
    }
  }

  function handlePause() {
    setPlaying(false);
    const v = videoRef.current;
    if (v && !v.ended && !doneRef.current) void save(false);
  }

  function toggle() {
    const v = videoRef.current!;
    if (v.paused) void v.play().catch(() => setFailed(true));
    else v.pause();
  }

  function seek(value: number) {
    const v = videoRef.current!;
    const limit = doneRef.current ? durationRef.current : maxWatched.current;
    v.currentTime = Math.max(0, Math.min(value, limit));
  }

  function toggleFullscreen() {
    const v = videoRef.current as FullscreenVideo;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (boxRef.current?.requestFullscreen) void boxRef.current.requestFullscreen();
    else v.webkitEnterFullscreen?.();
  }

  const timePct = duration > 0 ? (time / duration) * 100 : 0;
  const furthestPct = duration > 0 ? (Math.min(furthest, duration) / duration) * 100 : 0;

  return (
    <div ref={boxRef} className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full"
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onClick={toggle}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onPlay={() => setPlaying(true)}
        onPause={handlePause}
        onEnded={handleEnded}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onPlaying={() => setBuffering(false)}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onError={() => setFailed(true)}
      />

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-white">
          This video could not be loaded. Refresh the page or try again later.
        </div>
      )}
      {buffering && !failed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/90" />
        </div>
      )}
      {!playing && !buffering && !failed && (
        <button onClick={toggle} className="absolute inset-0 flex items-center justify-center" aria-label="Play">
          <span className="rounded-full bg-black/60 p-5 text-white"><Play className="h-8 w-8" /></span>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 text-white">
        <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="shrink-0">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <span className="shrink-0 text-xs tabular-nums">{formatDuration(time)} / {formatDuration(duration)}</span>
        <div className="relative h-5 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded bg-white/25">
            <div className="absolute inset-y-0 left-0 bg-white/45" style={{ width: `${furthestPct}%` }} />
            <div className="absolute inset-y-0 left-0 bg-teal-400" style={{ width: `${timePct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Seek"
          />
        </div>
        <button
          onClick={() => {
            const v = videoRef.current!;
            v.muted = !v.muted;
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="shrink-0"
        >
          {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = videoRef.current!;
            v.volume = Number(e.target.value);
            v.muted = Number(e.target.value) === 0;
          }}
          className="hidden w-20 accent-teal-400 sm:block"
          aria-label="Volume"
        />
        <button onClick={toggleFullscreen} aria-label="Fullscreen" className="shrink-0">
          {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
