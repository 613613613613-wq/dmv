import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUserData } from "../engine/store";
import { useLessonPack } from "../engine/contentPack";
import { t } from "../i18n";
import { loc } from "../engine/util";
import Sign from "../components/Sign";
import SceneAnimation from "../components/SceneAnimation";
import { hasGeneratedVideo, sceneVideoUrl } from "../engine/videoAssets";
import Confetti from "../components/Confetti";
import Narration from "../components/Narration";
import { hasLessonVideo } from "../engine/lessonVideoAssets";
import LessonVideoView from "./LessonVideoView";
import type { Lang, LessonStep } from "../types";

export default function LessonView() {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const { data, completeLesson, recordAttempt } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { lessons } = useLessonPack(data.profile.vehicleClass);

  const lesson = useMemo(
    () => lessons?.lessons.find((l) => l.id === lessonId) ?? null,
    [lessons, lessonId],
  );

  const [stepIdx, setStepIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Tracks the "hide confetti" timer so we can cancel it if the user
  // navigates to the next step (or unmounts) before it fires; otherwise the
  // timer would race against the next step's own confetti and create flicker.
  const confettiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function scheduleConfettiHide(ms: number) {
    if (confettiTimer.current) clearTimeout(confettiTimer.current);
    confettiTimer.current = setTimeout(() => {
      setConfetti(false);
      confettiTimer.current = null;
    }, ms);
  }
  useEffect(() => {
    return () => {
      if (confettiTimer.current) clearTimeout(confettiTimer.current);
    };
  }, []);

  // Keyboard shortcuts: Space/Enter/Right-arrow = continue,
  // A/B/C/D = pick that answer on a checkpoint. Hooks must run before any
  // early-return so the order stays stable across renders. We inline the
  // continue/pick logic instead of calling next()/pickAnswer() so the effect
  // doesn't depend on those (re-created every render) closures.
  useEffect(() => {
    if (!lesson) return;
    function onKey(e: KeyboardEvent) {
      if (!lesson) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName)) {
        // Allow Space/Enter on focused buttons to use native click handling.
        if (target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
      }
      const currentStep = lesson.steps[stepIdx];
      if (!currentStep) return;
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        if (currentStep.kind === "checkpoint" && chosen === null) return;
        e.preventDefault();
        if (stepIdx < lesson.steps.length - 1) {
          if (confettiTimer.current) {
            clearTimeout(confettiTimer.current);
            confettiTimer.current = null;
          }
          setConfetti(false);
          setStepIdx((i) => i + 1);
          setChosen(null);
        } else if (!completed) {
          completeLesson(lesson.id, lesson.xpReward);
          setCompleted(true);
          setConfetti(true);
        }
        return;
      }
      if (currentStep.kind === "checkpoint" && currentStep.question && chosen === null) {
        const idx = ["a", "b", "c", "d"].indexOf(e.key.toLowerCase());
        const choice = currentStep.question.choices[idx];
        if (idx >= 0 && choice) {
          e.preventDefault();
          setChosen(choice.id);
          const correct = choice.id === currentStep.question.correct;
          recordAttempt(currentStep.question.id, correct, 0);
          if (correct) {
            setConfetti(true);
            scheduleConfettiHide(1500);
          }
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson, stepIdx, chosen, completed, completeLesson, recordAttempt]);

  if (!lesson) return <div className="card h-72 animate-pulse" />;

  // If a Sora 2 narrated teaching video exists for this lesson, render the
  // full-video flow (video → checkpoint quiz → completion). Otherwise fall
  // back to the legacy step-by-step concept slides below.
  if (hasLessonVideo(lesson.id)) {
    return <LessonVideoView lesson={lesson} />;
  }

  const step: LessonStep = lesson.steps[stepIdx];
  const total = lesson.steps.length;
  const progress = ((stepIdx + 1) / total) * 100;

  // Preload the NEXT step's video (if any) so tapping Continue plays instantly.
  // We use a real <video preload="auto"> element rather than <link rel=preload>
  // because the latter has spotty cross-browser support for video resources.
  const nextStep = lesson.steps[stepIdx + 1];
  const nextVideoUrl =
    nextStep?.scene && hasGeneratedVideo(nextStep.scene)
      ? sceneVideoUrl(nextStep.scene)
      : null;

  function next() {
    if (stepIdx < total - 1) {
      // Cancel any in-flight confetti hide so it can't fire on the next step.
      if (confettiTimer.current) {
        clearTimeout(confettiTimer.current);
        confettiTimer.current = null;
      }
      setConfetti(false);
      setStepIdx((i) => i + 1);
      setChosen(null);
      return;
    }
    if (!completed) {
      completeLesson(lesson!.id, lesson!.xpReward);
      setCompleted(true);
      setConfetti(true);
    }
  }

  function pickAnswer(choiceId: string) {
    if (chosen !== null || !step.question) return;
    setChosen(choiceId);
    const correct = choiceId === step.question.correct;
    recordAttempt(step.question.id, correct, 0);
    if (correct) {
      setConfetti(true);
      scheduleConfettiHide(1500);
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] -m-4 md:m-0">
      <Confetti show={confetti} count={completed ? 120 : 40} />
      {nextVideoUrl && (
        <video
          key={nextVideoUrl}
          src={nextVideoUrl}
          preload="auto"
          muted
          playsInline
          className="absolute h-px w-px opacity-0"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
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
            {stepIdx + 1}/{total}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {step.kind === "intro" && (
          <div className="text-center">
            <div className="mx-auto mb-5 text-7xl">{step.imageEmoji ?? lesson.emoji}</div>
            <h1 className="text-2xl font-bold text-ink-900 md:text-3xl">
              {loc(step.title ?? lesson.title, lang)}
            </h1>
            {step.body && (
              <>
                <p className="mx-auto mt-3 max-w-md text-sm text-ink-600 md:text-base">
                  {loc(step.body, lang)}
                </p>
                <div className="mt-4 flex justify-center">
                  <Narration
                    text={`${loc(step.title ?? lesson.title, lang)}. ${loc(step.body, lang)}`}
                    lang={lang}
                    lessonId={lesson.id}
                    stepIdx={stepIdx}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step.kind === "concept" && (
          <div className="text-center">
            {step.scene ? (
              <div className="mx-auto mb-6 max-w-xl">
                <SceneAnimation
                  scene={step.scene}
                  lang={lang}
                  fallbackSign={step.sign}
                  fallbackSignValue={step.signValue}
                />
              </div>
            ) : step.sign ? (
              <div className="mx-auto mb-6 flex justify-center">
                <Sign kind={step.sign} size={180} speedValue={step.signValue} />
              </div>
            ) : step.imageEmoji ? (
              <div className="mb-6 text-7xl">{step.imageEmoji}</div>
            ) : null}
            {step.title && (
              <h2 className="text-xl font-bold text-ink-900 md:text-2xl">
                {loc(step.title, lang)}
              </h2>
            )}
            {step.body && (
              <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-700">
                {loc(step.body, lang)}
              </p>
            )}
            {step.body && (
              <div className="mt-4 flex justify-center">
                <Narration
                  text={`${step.title ? loc(step.title, lang) + ". " : ""}${loc(step.body, lang)}`}
                  lang={lang}
                  lessonId={lesson.id}
                  stepIdx={stepIdx}
                />
              </div>
            )}
          </div>
        )}

        {step.kind === "checkpoint" && step.question && (
          <div>
            <div className="text-center text-xs font-medium uppercase tracking-wider text-gulf-600">
              {lang === "es" ? "Mini-control" : "Quick check"}
            </div>
            <h2 className="mt-2 text-center text-xl font-bold text-ink-900 md:text-2xl">
              {loc(step.question.stem, lang)}
            </h2>
            <ul className="mt-6 space-y-2">
              {step.question.choices.map((c) => {
                const isChosen = chosen === c.id;
                const isCorrect = c.id === step.question!.correct;
                let tone = "bg-white text-ink-900 ring-ink-200 hover:ring-ink-400 hover:bg-ink-50";
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
                  chosen === step.question.correct
                    ? "bg-emerald-50 text-emerald-900"
                    : "bg-sun-50 text-ink-800"
                }`}
              >
                <div className="font-semibold">
                  {chosen === step.question.correct ? t("correct", lang) : t("notQuite", lang)}
                </div>
                <p className="mt-1 leading-relaxed">{loc(step.question.explanation, lang)}</p>
              </div>
            )}
          </div>
        )}

        {step.kind === "outro" && (
          <div className="text-center">
            <div className="mx-auto mb-5 text-7xl">{completed ? "🎉" : "🏁"}</div>
            <h1 className="text-2xl font-bold text-ink-900 md:text-3xl">
              {completed
                ? t("greatJob", lang)
                : loc(step.title ?? { en: "Lesson complete!", es: "¡Lección completada!" }, lang)}
            </h1>
            {step.body && (
              <p className="mx-auto mt-3 max-w-md text-sm text-ink-600">
                {loc(step.body, lang)}
              </p>
            )}
            {completed && (
              <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-sun-50 px-4 py-2 text-sm font-bold text-sun-700">
                <span>+{lesson.xpReward} XP</span>
                <span>·</span>
                <span>{t("earnedXp", lang)}</span>
              </div>
            )}
            {completed && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <Link to="/learn" className="btn-primary">
                  {lang === "es" ? "Más lecciones" : "More lessons"}
                </Link>
                <Link to="/practice" className="text-sm font-medium text-gulf-600 hover:text-gulf-700">
                  {t("beginPracticing", lang)} →
                </Link>
              </div>
            )}
          </div>
        )}

        {(step.kind !== "outro" || !completed) && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={next}
              disabled={step.kind === "checkpoint" && chosen === null}
              className="btn-primary px-10"
            >
              {step.kind === "outro" ? t("done", lang) : t("continue", lang)} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
