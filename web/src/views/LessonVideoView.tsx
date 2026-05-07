import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserData } from "../engine/store";
import { t } from "../i18n";
import { loc } from "../engine/util";
import Confetti from "../components/Confetti";
import { lessonVideoUrl } from "../engine/lessonVideoAssets";
import type { Lang, Lesson, LessonStep } from "../types";

type Phase = "video" | "quiz" | "done";

interface Props {
  lesson: Lesson;
}

/**
 * Full-video lesson mode. Plays the ~20s narrated Sora 2 teaching video, then
 * runs every checkpoint step from the lesson as a Q&A reinforcement quiz, then
 * the completion screen with XP. Used only when a generated MP4 exists for the
 * lesson id; otherwise the legacy step-by-step view renders instead.
 */
export default function LessonVideoView({ lesson }: Props) {
  const navigate = useNavigate();
  const { data, completeLesson, recordAttempt } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;

  const checkpoints = useMemo<LessonStep[]>(
    () => lesson.steps.filter((s) => s.kind === "checkpoint" && s.question),
    [lesson],
  );

  const [phase, setPhase] = useState<Phase>("video");
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [completed, setCompleted] = useState(false);
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  function scheduleConfettiHide(ms: number) {
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => {
      setConfetti(false);
      confettiTimer.current = null;
    }, ms);
  }
  useEffect(
    () => () => {
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
    },
    [],
  );

  function startQuizOrFinish() {
    if (checkpoints.length > 0) {
      setPhase("quiz");
      setQIdx(0);
      setChosen(null);
    } else {
      finishLesson();
    }
  }

  function finishLesson() {
    if (!completed) {
      completeLesson(lesson.id, lesson.xpReward);
      setCompleted(true);
      setConfetti(true);
    }
    setPhase("done");
  }

  function nextQuestion() {
    if (qIdx < checkpoints.length - 1) {
      if (confettiTimer.current) {
        clearTimeout(confettiTimer.current);
        confettiTimer.current = null;
      }
      setConfetti(false);
      setQIdx((i) => i + 1);
      setChosen(null);
    } else {
      finishLesson();
    }
  }

  function pickAnswer(choiceId: string) {
    const q = checkpoints[qIdx]?.question;
    if (chosen !== null || !q) return;
    setChosen(choiceId);
    const correct = choiceId === q.correct;
    recordAttempt(q.id, correct, 0);
    if (correct) {
      setConfetti(true);
      scheduleConfettiHide(1500);
    }
  }

  // Keyboard: Space/Enter advances when allowed; A/B/C/D picks a choice.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        target.tagName === "BUTTON" &&
        (e.key === " " || e.key === "Enter")
      ) {
        return;
      }
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        if (phase === "video" && videoEnded) startQuizOrFinish();
        else if (phase === "quiz" && chosen !== null) nextQuestion();
        return;
      }
      if (phase === "quiz") {
        const q = checkpoints[qIdx]?.question;
        if (!q || chosen !== null) return;
        const idx = ["a", "b", "c", "d"].indexOf(e.key.toLowerCase());
        const choice = q.choices[idx];
        if (idx >= 0 && choice) {
          e.preventDefault();
          pickAnswer(choice.id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, videoEnded, chosen, qIdx, checkpoints]);

  const totalSteps = 1 + checkpoints.length + 1; // video + quiz + done
  const currentStep =
    phase === "video" ? 1 : phase === "quiz" ? 1 + qIdx + 1 : totalSteps;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-[calc(100vh-6rem)] -m-4 md:m-0">
      <Confetti show={confetti} count={completed ? 120 : 40} />

      <div className="sticky top-0 z-10 bg-white/95 px-4 py-3 backdrop-blur md:rounded-t-2xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/learn")}
            className="btn-ghost text-xs"
          >
            ← {t("exit", lang)}
          </button>
          <div className="flex-1">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
              {t("lessonMode", lang)} · {lesson.emoji} {loc(lesson.title, lang)}
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full bg-gulf-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-medium text-ink-500 tabular-nums">
            {currentStep}/{totalSteps}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {phase === "video" && (
          <div className="text-center">
            <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gulf-500 to-gulf-700 shadow-lg">
              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                </div>
              )}
              <video
                ref={videoRef}
                src={lessonVideoUrl(lesson.id)}
                className={`h-full w-full transition-opacity duration-500 ${
                  videoReady ? "opacity-100" : "opacity-0"
                }`}
                autoPlay
                playsInline
                controls
                onLoadedData={() => setVideoReady(true)}
                onEnded={() => setVideoEnded(true)}
              />
            </div>
            <h1 className="mt-6 text-xl font-bold text-ink-900 md:text-2xl">
              {loc(lesson.title, lang)}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              {videoEnded
                ? lang === "es"
                  ? "Listo. Vamos a un mini-control para fijar lo aprendido."
                  : "Nice. Let's run a quick check to lock it in."
                : lang === "es"
                ? "Mira el video. Puedes repetirlo cuantas veces quieras."
                : "Watch the video. You can replay it any time."}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={startQuizOrFinish}
                disabled={!videoEnded}
                className="btn-primary px-10"
              >
                {checkpoints.length > 0
                  ? lang === "es"
                    ? "Mini-control →"
                    : "Quick check →"
                  : t("done", lang)}{" "}
              </button>
            </div>
            {!videoEnded && (
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    try {
                      videoRef.current.currentTime =
                        videoRef.current.duration ?? 0;
                    } catch {
                      /* ignore */
                    }
                  }
                  setVideoEnded(true);
                }}
                className="mt-3 text-xs font-medium text-ink-500 underline-offset-2 hover:text-ink-700 hover:underline"
              >
                {lang === "es" ? "Saltar el video" : "Skip the video"}
              </button>
            )}
          </div>
        )}

        {phase === "quiz" && checkpoints[qIdx]?.question && (() => {
          const q = checkpoints[qIdx].question!;
          return (
            <div>
              <div className="text-center text-xs font-medium uppercase tracking-wider text-gulf-600">
                {lang === "es"
                  ? `Mini-control ${qIdx + 1}/${checkpoints.length}`
                  : `Quick check ${qIdx + 1}/${checkpoints.length}`}
              </div>
              <h2 className="mt-2 text-center text-xl font-bold text-ink-900 md:text-2xl">
                {loc(q.stem, lang)}
              </h2>
              <ul className="mt-6 space-y-2">
                {q.choices.map((c) => {
                  const isChosen = chosen === c.id;
                  const isCorrect = c.id === q.correct;
                  let tone =
                    "bg-white text-ink-900 ring-ink-200 hover:ring-ink-400 hover:bg-ink-50";
                  if (chosen !== null) {
                    if (isCorrect) tone = "bg-emerald-50 text-emerald-900 ring-emerald-300";
                    else if (isChosen) tone = "bg-coral-400/10 text-coral-700 ring-coral-400";
                    else tone = "bg-white text-ink-500 ring-ink-100";
                  }
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => pickAnswer(c.id)}
                        disabled={chosen !== null}
                        className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ring-1 transition ${tone}`}
                      >
                        <span
                          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${
                            chosen !== null && isCorrect
                              ? "bg-emerald-500 text-white ring-emerald-500"
                              : chosen !== null && isChosen
                              ? "bg-coral-500 text-white ring-coral-500"
                              : "bg-ink-50 text-ink-700 ring-ink-200"
                          }`}
                        >
                          {chosen !== null && isCorrect
                            ? "✓"
                            : chosen !== null && isChosen
                            ? "✗"
                            : c.id.toUpperCase()}
                        </span>
                        <span className="flex-1 leading-snug">{loc(c.text, lang)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {chosen !== null && (
                <div
                  className={`mt-5 rounded-xl p-4 text-sm ${
                    chosen === q.correct
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-sun-50 text-ink-800"
                  }`}
                >
                  <div className="font-semibold">
                    {chosen === q.correct ? t("correct", lang) : t("notQuite", lang)}
                  </div>
                  <p className="mt-1 leading-relaxed">{loc(q.explanation, lang)}</p>
                </div>
              )}
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={nextQuestion}
                  disabled={chosen === null}
                  className="btn-primary px-10"
                >
                  {qIdx < checkpoints.length - 1
                    ? `${t("continue", lang)} →`
                    : `${t("done", lang)} →`}
                </button>
              </div>
            </div>
          );
        })()}

        {phase === "done" && (
          <div className="text-center">
            <div className="mx-auto mb-5 text-7xl">🎉</div>
            <h1 className="text-2xl font-bold text-ink-900 md:text-3xl">
              {t("greatJob", lang)}
            </h1>
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-sun-50 px-4 py-2 text-sm font-bold text-sun-700">
              <span>+{lesson.xpReward} XP</span>
              <span>·</span>
              <span>{t("earnedXp", lang)}</span>
            </div>
            <div className="mt-6 flex flex-col items-center gap-2">
              <Link to="/learn" className="btn-primary">
                {lang === "es" ? "Más lecciones" : "More lessons"}
              </Link>
              <Link
                to="/practice"
                className="text-sm font-medium text-gulf-600 hover:text-gulf-700"
              >
                {t("beginPracticing", lang)} →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
