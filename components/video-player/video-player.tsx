'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
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

type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export default function VideoPlayer({
  src,
  lessonId,
  initialWatched,
  alreadyCompleted,
  knownDuration,
  onPercent,
  onCompleted,
  onError,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const durationRef = useRef(knownDuration ?? 0);
  const lastSent = useRef(0);
  const completedRef = useRef(alreadyCompleted);

  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [time, setTime] = useState(initialWatched);
  const [duration, setDuration] = useState(knownDuration ?? 0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [failed, setFailed] = useState(false);

  /*
   * Progressni serverga yuborish.
   * Endi oldinga seek qilishga hech qanday cheklov yo'q.
   */
  async function saveProgress(ended = false) {
    const v = videoRef.current;
    const d = durationRef.current;

    if (!v || !d || !isFinite(d)) return;

    const watchedSeconds = Math.max(
      0,
      Math.min(v.currentTime, d)
    );

    if (!ended && watchedSeconds <= 0) return;

    lastSent.current = Date.now();

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          watchedSeconds,
          duration: d,
          ended,
        }),
        keepalive: true,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (ended) {
          onError(data?.error ?? 'Progressni saqlab bo‘lmadi.');
        }
        return;
      }

      if (data?.completed) {
        completedRef.current = true;
        onPercent(100);
        onCompleted();
      }
    } catch {
      if (ended) {
        onError('Internet xatosi. Progress saqlanmadi.');
      }
    }
  }

  /*
   * Sahifadan chiqishda progressni saqlash.
   */
  useEffect(() => {
    const saveBeforeLeave = () => {
      const v = videoRef.current;
      const d = durationRef.current;

      if (!v || !d || !isFinite(d)) return;

      const body = JSON.stringify({
        lessonId,
        watchedSeconds: Math.max(0, Math.min(v.currentTime, d)),
        duration: d,
        ended: false,
      });

      navigator.sendBeacon(
        '/api/progress',
        new Blob([body], {
          type: 'application/json',
        })
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveBeforeLeave();
      }
    };

    document.addEventListener(
      'visibilitychange',
      onVisibilityChange
    );

    window.addEventListener(
      'pagehide',
      saveBeforeLeave
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        onVisibilityChange
      );

      window.removeEventListener(
        'pagehide',
        saveBeforeLeave
      );
    };
  }, [lessonId]);

  /*
   * Fullscreen.
   */
  useEffect(() => {
    const handleFullscreen = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreen
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreen
      );
    };
  }, []);

  /*
   * Video metadata yuklanganda.
   */
  function handleLoadedMetadata() {
    const v = videoRef.current;

    if (!v) return;

    durationRef.current = v.duration;
    setDuration(v.duration);
    setBuffering(false);

    /*
     * Oxirgi ko‘rilgan joydan davom ettirish.
     * Lekin endi foydalanuvchi undan keyinga ham bemalol o'tishi mumkin.
     */
    if (!completedRef.current && initialWatched > 0) {
      v.currentTime = Math.min(
        initialWatched,
        Math.max(0, v.duration - 0.1)
      );
      setTime(v.currentTime);
    }
  }

  /*
   * Video vaqti o‘zgarganda.
   *
   * MUHIM:
   * Bu yerda maxWatched yoki seek-block YO‘Q.
   */
  function handleTimeUpdate() {
    const v = videoRef.current;

    if (!v) return;

    const t = Math.max(
      0,
      Math.min(v.currentTime, durationRef.current || v.duration || 0)
    );

    setTime(t);

    const d = durationRef.current || v.duration;

    if (d > 0) {
      const pct = Math.min(
        100,
        Math.floor((t / d) * 100)
      );

      onPercent(pct);
    }

    /*
     * Har 15 sekundda progress saqlanadi.
     */
    if (
      !v.paused &&
      Date.now() - lastSent.current > 15000
    ) {
      void saveProgress(false);
    }
  }

  function handleEnded() {
    setPlaying(false);

    const v = videoRef.current;

    if (!v) return;

    setTime(v.duration);

    onPercent(100);

    void saveProgress(true);
  }

  function handlePause() {
    setPlaying(false);

    const v = videoRef.current;

    if (v && !v.ended) {
      void saveProgress(false);
    }
  }

  function toggle() {
    const v = videoRef.current;

    if (!v) return;

    if (v.paused) {
      void v.play().catch(() => {
        setFailed(true);
      });
    } else {
      v.pause();
    }
  }

  /*
   * SEEK:
   * Endi istalgan joyga o'tish mumkin.
   */
  function seek(value: number) {
    const v = videoRef.current;

    if (!v) return;

    const d = durationRef.current || v.duration;

    v.currentTime = Math.max(
      0,
      Math.min(value, d)
    );

    setTime(v.currentTime);
  }

  function toggleFullscreen() {
    const v = videoRef.current as FullscreenVideo;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    if (boxRef.current?.requestFullscreen) {
      void boxRef.current.requestFullscreen();
      return;
    }

    v.webkitEnterFullscreen?.();
  }

  const timePct =
    duration > 0
      ? (time / duration) * 100
      : 0;

  return (
    <div
      ref={boxRef}
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
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
          Videoni yuklab bo‘lmadi. Sahifani yangilang
          yoki keyinroq qayta urinib ko‘ring.
        </div>
      )}

      {buffering && !failed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/90" />
        </div>
      )}

      {!playing && !buffering && !failed && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <span className="rounded-full bg-black/60 p-5 text-white">
            <Play className="h-8 w-8" />
          </span>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 text-white">
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="shrink-0"
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        <span className="shrink-0 text-xs tabular-nums">
          {formatDuration(time)} / {formatDuration(duration)}
        </span>

        <div className="relative h-5 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded bg-white/25">
            <div
              className="absolute inset-y-0 left-0 bg-teal-400"
              style={{
                width: `${timePct}%`,
              }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(
              time,
              duration || 0
            )}
            onChange={(e) =>
              seek(Number(e.target.value))
            }
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Seek"
          />
        </div>

        <button
          onClick={() => {
            const v = videoRef.current;

            if (!v) return;

            v.muted = !v.muted;
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="shrink-0"
        >
          {muted || volume === 0 ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = videoRef.current;

            if (!v) return;

            const value = Number(e.target.value);

            v.volume = value;
            v.muted = value === 0;
          }}
          className="hidden w-20 accent-teal-400 sm:block"
          aria-label="Volume"
        />

        <button
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
          className="shrink-0"
        >
          {fullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}