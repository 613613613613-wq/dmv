import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContentPack } from "../engine/contentPack";
import { useUserData } from "../engine/store";
import { generateMockTest, scoreMockTest, type MockTest } from "../engine/mockTest";
import QuestionCard from "../components/QuestionCard";
import Confetti from "../components/Confetti";
import { formatDuration } from "../engine/util";
import { t } from "../i18n";
import type { Lang } from "../types";

const HEARTS_START = 3;

export default function MockExamView() {
  const { data, recordMockResult, recordAttempt } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { pack } = useContentPack(data.profile.vehicleClass);
  const navigate = useNavigate();

  const test = useMemo<MockTest | null>(() => (pack ? generateMockTest(pack) : null), [pack]);
  const startedAt = useRef<number>(Date.now());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [hearts, setHearts] = useState(HEARTS_START);
  const [confetti, setConfetti] = useState(false);
  const [outOfHearts, setOutOfHearts] = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (Object.keys(answers).length > 0 && !submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [answers]);

  const submittedRef = useRef(false);

  if (!pack || !test) return <div className="card h-72 animate-pulse" />;

  const q = test.questions[index];
  const total = test.questions.length;
  const answered = Object.keys(answers).length;
  const finished = answered === total;

  function pick(choiceId: string) {
    if (answers[q.id]) return; // already answered (no overwrite during exam to enable hearts)
    const isCorrect = choiceId === q.correct;
    setAnswers((a) => ({ ...a, [q.id]: choiceId }));
    if (isCorrect) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 600);
    } else {
      setHearts((h) => {
        const nh = h - 1;
        if (nh <= 0) {
          setOutOfHearts(true);
        }
        return nh;
      });
    }
  }

  function next() { if (index < total - 1) setIndex(index + 1); }
  function prev() { if (index > 0) setIndex(index - 1); }

  function submit(forced = false) {
    if (!test || submittedRef.current) return;
    submittedRef.current = true;
    const result = scoreMockTest(test, answers, Math.floor((Date.now() - startedAt.current) / 1000));
    if (forced) result.passed = false;
    recordMockResult(result);
    for (const question of test.questions) {
      const chosen = answers[question.id];
      if (!chosen) continue;
      recordAttempt(question.id, chosen === question.correct, 0);
    }
    sessionStorage.setItem(
      "dmvprep.lastMock",
      JSON.stringify({
        questionIds: test.questions.map((x) => x.id),
        answers,
        result,
        forcedByHearts: forced,
      }),
    );
    navigate("/mock/result");
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Confetti show={confetti} count={20} />

      <div className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => navigate("/mock")} className="btn-ghost text-xs">
            ← {t("exit", lang)}
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: HEARTS_START }).map((_, i) => (
              <span key={i} className={`text-base ${i < hearts ? "" : "grayscale opacity-30"}`}>
                ❤️
              </span>
            ))}
          </div>
          <div className="text-xs font-semibold text-ink-700">
            {index + 1} / {total} · {answered} {t("answered", lang)}
          </div>
          <div className="rounded-full bg-ink-900 px-2.5 py-1 font-mono text-xs text-white tabular-nums">
            {formatDuration(elapsed)}
          </div>
        </div>
        <div className="h-1 w-full bg-ink-100">
          <div
            className="h-full bg-gulf-400 transition-all"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <QuestionCard
          pack={pack}
          question={q}
          data={data}
          mode="exam"
          selectedId={answers[q.id] ?? null}
          showHandbook={false}
          onAnswer={(choiceId) => pick(choiceId)}
          questionIndex={index}
          questionTotal={total}
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={prev} disabled={index === 0} className="btn-secondary">
            ← {t("back", lang)}
          </button>
          {index < total - 1 ? (
            <button type="button" onClick={next} className="btn-primary">
              {t("next", lang)} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={!finished}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700"
            >
              {finished ? t("submit", lang) : `${total - answered} ${t("unanswered", lang)}`}
            </button>
          )}
        </div>

        <NavGrid
          total={total}
          current={index}
          answers={answers}
          questionIds={test.questions.map((x) => x.id)}
          correctMap={Object.fromEntries(test.questions.map((x) => [x.id, x.correct]))}
          onJump={setIndex}
        />
      </div>

      {outOfHearts && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 flex items-end justify-center bg-ink-900/60 p-4 backdrop-blur md:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-card">
            <div className="text-5xl">💔</div>
            <h3 className="mt-4 text-lg font-bold text-ink-900">{t("outOfHearts", lang)}</h3>
            <p className="mt-2 text-sm text-ink-600">{t("outOfHeartsBody", lang)}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button type="button" onClick={() => submit(true)} className="btn-primary">
                {t("review", lang)} →
              </button>
              <button
                type="button"
                onClick={() => { setOutOfHearts(false); setHearts(1); }}
                className="btn-ghost text-xs"
              >
                {t("continue", lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavGrid({
  total, current, answers, questionIds, correctMap, onJump,
}: {
  total: number;
  current: number;
  answers: Record<string, string>;
  questionIds: string[];
  correctMap: Record<string, string>;
  onJump: (i: number) => void;
}) {
  return (
    <div className="card mt-6 p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">Map</div>
      <div className="mt-2 grid grid-cols-10 gap-1.5">
        {questionIds.map((id, i) => {
          const ans = answers[id];
          const isCurrent = i === current;
          const correct = ans !== undefined ? ans === correctMap[id] : null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onJump(i)}
              className={`flex h-8 items-center justify-center rounded text-[11px] font-semibold transition ${
                isCurrent
                  ? "bg-ink-900 text-white"
                  : correct === true
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : correct === false
                  ? "bg-coral-100 text-coral-700 hover:bg-coral-200"
                  : "bg-ink-100 text-ink-500 hover:bg-ink-200"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
