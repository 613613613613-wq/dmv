import { useEffect, useMemo, useRef, useState } from "react";
import { useUserData } from "../engine/store";
import { t } from "../i18n";
import { SONGS, type Song } from "../data/songs";
import type { Lang } from "../types";

function fmt(sec: number) {
  // Show a placeholder ("--:--") instead of 0:00 when the audio metadata
  // hasn't loaded yet, so the player doesn't look broken on first render.
  if (!isFinite(sec) || sec <= 0) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongsView() {
  const { data } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;

  const playlist = useMemo(
    () =>
      SONGS.filter((s) =>
        s.vehicleClasses.includes(data.profile.vehicleClass ?? "car"),
      ),
    [data.profile.vehicleClass],
  );

  const [currentId, setCurrentId] = useState<string>(playlist[0]?.id ?? "");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = playlist.find((s) => s.id === currentId) ?? playlist[0];

  // Reset transport state whenever the user switches songs. The actual
  // play/paused state is driven by the audio element's events (onPlay/onPause)
  // to avoid races between user clicks and the play() promise resolving.
  // We also explicitly call load() so the new src is fetched (some browsers
  // can otherwise reuse stale metadata when only the src attribute changes).
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setLoadError(false);
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
      a.load();
    }
  }, [currentId]);

  // Pause audio if the user navigates away from this view while it's playing.
  useEffect(() => {
    const a = audioRef.current;
    return () => {
      if (a) a.pause();
    };
  }, []);

  function togglePlay() {
    const a = audioRef.current;
    if (!a || loadError) return;
    if (a.paused) {
      // Don't manually flip `playing` here — the onPlay/onPause events do it,
      // which keeps the UI in sync even if the user double-taps.
      a.play().catch(() => setLoadError(true));
    } else {
      a.pause();
    }
  }

  function selectSong(id: string) {
    setCurrentId(id);
  }

  function skip(delta: number) {
    if (!playlist.length) return;
    const idx = playlist.findIndex((s) => s.id === currentId);
    const next = (idx + delta + playlist.length) % playlist.length;
    setCurrentId(playlist[next].id);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a || !duration) return;
    const t = (Number(e.target.value) / 1000) * duration;
    a.currentTime = t;
    setCurrentTime(t);
  }

  if (!current) {
    return (
      <div className="card p-6 text-sm text-ink-500">
        {lang === "es"
          ? "Aún no hay canciones para este vehículo."
          : "No songs available for this vehicle class yet."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink-900 md:text-3xl">
          {t("songsTitle", lang)}
        </h1>
        <p className="text-sm text-ink-600 md:text-base">{t("songsBlurb", lang)}</p>
      </header>

      {/* Now playing card */}
      <NowPlaying
        song={current}
        lang={lang}
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onSkip={skip}
        onSeek={seek}
        canSkip={playlist.length > 1}
      />

      <audio
        ref={audioRef}
        src={current.audioFile}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (isFinite(d) && d > 0) setDuration(d);
        }}
        onDurationChange={(e) => {
          // Some browsers (notably Chromium with chunked audio) populate
          // duration via this event rather than loadedmetadata.
          const d = e.currentTarget.duration;
          if (isFinite(d) && d > 0) setDuration(d);
        }}
        onCanPlay={(e) => {
          // Last-resort safety net: by the time audio can play, duration
          // is virtually always known. Ensures the scrubber never stays at 0:00.
          const d = e.currentTarget.duration;
          if (isFinite(d) && d > 0) setDuration((cur) => (cur > 0 ? cur : d));
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          if (playlist.length > 1) skip(1);
          else setPlaying(false);
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onError={() => setLoadError(true)}
      />

      {loadError && (
        <div
          role="alert"
          className="card flex flex-wrap items-center justify-between gap-3 border border-coral-200 bg-coral-50 p-4 text-sm text-coral-700"
        >
          <span>
            {lang === "es"
              ? "No se pudo cargar la canción. Comprueba tu conexión y vuelve a intentarlo."
              : "Couldn't load this song. Check your connection and try again."}
          </span>
          <button
            type="button"
            onClick={() => {
              // Clear the error first so the audio element re-renders without
              // the disabled state, then force a re-fetch via load(). The
              // onCanPlay/onLoadedMetadata handlers will repopulate duration.
              setLoadError(false);
              const a = audioRef.current;
              if (a) {
                a.load();
                a.play().catch(() => setLoadError(true));
              }
            }}
            className="rounded-full bg-coral-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-coral-700"
          >
            {t("retry", lang)}
          </button>
        </div>
      )}

      {/* "What this song teaches" key points */}
      <section className="card p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-gulf-600">
          {lang === "es" ? "Lo que te ayuda a recordar" : "What it helps you remember"}
        </div>
        <h3 className="mt-1 text-base font-bold text-ink-900">
          {current.topic[lang]}
        </h3>
        <ul className="mt-3 space-y-2">
          {current.bullets[lang].map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-ink-800">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gulf-500" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Playlist */}
      {playlist.length > 1 && (
        <section className="card p-2">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
            {lang === "es" ? "Lista de reproducción" : "Playlist"}
          </div>
          <ul>
            {playlist.map((s) => {
              const isActive = s.id === currentId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => selectSong(s.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      isActive
                        ? "bg-ink-900 text-white"
                        : "text-ink-800 hover:bg-ink-50"
                    }`}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {s.title[lang]}
                      </span>
                      <span
                        className={`block truncate text-xs ${
                          isActive ? "text-white/70" : "text-ink-500"
                        }`}
                      >
                        {s.topic[lang]}
                      </span>
                    </span>
                    {isActive && playing && (
                      <span aria-hidden className="text-xs">▶</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function NowPlaying({
  song,
  lang,
  playing,
  currentTime,
  duration,
  onTogglePlay,
  onSkip,
  onSeek,
  canSkip,
}: {
  song: Song;
  lang: Lang;
  playing: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSkip: (delta: number) => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canSkip: boolean;
}) {
  const sliderValue = duration > 0 ? Math.round((currentTime / duration) * 1000) : 0;

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-gulf-700 to-coral-600 p-6 text-white shadow-card md:p-8">
      <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:gap-7">
        <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-3xl bg-white/10 text-7xl ring-1 ring-white/20 backdrop-blur md:h-40 md:w-40 md:text-8xl">
          {song.emoji}
        </div>
        <div className="min-w-0 flex-1 text-center md:text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-sun-200">
            {lang === "es" ? "Reproduciendo" : "Now Playing"}
          </div>
          <h2 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">
            {song.title[lang]}
          </h2>
          <p className="mt-1 text-sm text-white/80 md:text-base">
            {song.description[lang]}
          </p>

          {/* Transport */}
          <div className="mt-5 flex items-center justify-center gap-3 md:justify-start">
            <button
              type="button"
              onClick={() => onSkip(-1)}
              disabled={!canSkip}
              aria-label={lang === "es" ? "Anterior" : "Previous"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M6 5h2v14H6zM20 5v14L9 12z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={
                playing
                  ? lang === "es"
                    ? "Pausar"
                    : "Pause"
                  : lang === "es"
                  ? "Reproducir"
                  : "Play"
              }
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink-900 shadow-card transition hover:scale-105"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => onSkip(1)}
              disabled={!canSkip}
              aria-label={lang === "es" ? "Siguiente" : "Next"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scrubber */}
      <div className="mt-6 flex items-center gap-3 text-xs tabular-nums text-white/80">
        <span className="w-10 text-right">{fmt(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={sliderValue}
          onChange={onSeek}
          aria-label={lang === "es" ? "Posición de reproducción" : "Playback position"}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-sun-300"
        />
        <span className="w-10">{fmt(duration)}</span>
      </div>
    </section>
  );
}
