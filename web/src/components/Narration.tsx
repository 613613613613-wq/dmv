import { useEffect, useRef, useState } from "react";
import type { Lang } from "../types";
import { hasNarration, narrationUrl } from "../engine/narrationAssets";

interface Props {
  text: string;
  lang: Lang;
  /** When provided, plays the pre-generated AI-voice clip if one exists. */
  lessonId?: string;
  stepIdx?: number;
  className?: string;
}

const speechSupported =
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof SpeechSynthesisUtterance !== "undefined";

export default function Narration({
  text,
  lang,
  lessonId,
  stepIdx,
  className = "",
}: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const useFile =
    lessonId !== undefined &&
    stepIdx !== undefined &&
    hasNarration(lessonId, stepIdx, lang);

  // Stop any in-flight playback whenever inputs change or on unmount.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (speechSupported) window.speechSynthesis.cancel();
    };
  }, [text, lang, lessonId, stepIdx]);

  useEffect(() => {
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (speechSupported) window.speechSynthesis.cancel();
  }, [text, lang, lessonId, stepIdx]);

  if (!text.trim()) return null;
  if (!useFile && !speechSupported) return null;

  function play() {
    if (useFile) {
      const a = new Audio(narrationUrl(lessonId!, stepIdx!, lang));
      a.preload = "auto";
      a.onended = () => setPlaying(false);
      a.onerror = () => {
        // Fall back to Web Speech if the file fails to load.
        setPlaying(false);
        playSpeech();
      };
      audioRef.current = a;
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
          playSpeech();
        });
    } else {
      playSpeech();
    }
  }

  function playSpeech() {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-US" : "en-US";
    u.rate = 0.95;
    u.pitch = 1;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setPlaying(true);
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (speechSupported) window.speechSynthesis.cancel();
    setPlaying(false);
  }

  const label = playing
    ? lang === "es"
      ? "Detener narración"
      : "Stop narration"
    : lang === "es"
    ? "Escuchar lección"
    : "Listen to lesson";

  return (
    <button
      type="button"
      onClick={playing ? stop : play}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
        playing
          ? "bg-gulf-600 text-white ring-gulf-600 hover:bg-gulf-700"
          : "bg-white text-gulf-700 ring-gulf-300 hover:bg-gulf-50"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="currentColor"
        aria-hidden="true"
      >
        {playing ? (
          <>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </>
        ) : (
          <>
            <path d="M3 9v6h4l5 4V5L7 9H3z" />
            <path
              d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
              opacity="0.85"
            />
            <path
              d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
              opacity="0.6"
            />
          </>
        )}
      </svg>
      <span>{playing ? (lang === "es" ? "Detener" : "Stop") : (lang === "es" ? "Escuchar" : "Listen")}</span>
    </button>
  );
}
