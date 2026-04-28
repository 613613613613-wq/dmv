import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContentPack } from "../engine/contentPack";
import { useUserData } from "../engine/store";
import { generateMockTest, scoreMockTest, type MockTest } from "../engine/mockTest";
import QuestionCard from "../components/QuestionCard";
import { formatDuration } from "../engine/util";

export default function MockExamView() {
  const { pack } = useContentPack();
  const { data, recordMockResult, recordAttempt } = useUserData();
  const navigate = useNavigate();

  const test = useMemo<MockTest | null>(() => (pack ? generateMockTest(pack) : null), [pack]);
  const startedAt = useRef<number>(Date.now());
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Warn before nav-away on accidental browser back.
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
    setAnswers((a) => ({ ...a, [q.id]: choiceId }));
  }

  function next() {
    if (index < total - 1) setIndex(index + 1);
  }
  function prev() {
    if (index > 0) setIndex(index - 1);
  }

  function submit() {
    if (!test) return;
    submittedRef.current = true;
    const result = scoreMockTest(test, answers, Math.floor((Date.now() - startedAt.current) / 1000));
    recordMockResult(result);
    // Also feed each answer into the SRS history so the mock affects future practice.
    for (const question of test.questions) {
      const chosen = answers[question.id];
      if (!chosen) continue;
      recordAttempt(question.id, chosen === question.correct, 0);
    }
    // Stash the test snapshot in sessionStorage so the result page can render review without re-shuffling.
    sessionStorage.setItem(
      "dmvprep.lastMock",
      JSON.stringify({
        questionIds: test.questions.map((x) => x.id),
        answers,
        result,
      }),
    );
    navigate("/mock/result");
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button type="button" onClick={() => navigate("/mock")} className="btn-ghost text-xs">
            ← Quit
          </button>
          <div className="text-xs font-semibold text-ink-700">
            Question {index + 1} of {total} · {answered} answered
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
            ← Previous
          </button>
          {index < total - 1 ? (
            <button type="button" onClick={next} className="btn-primary">
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!finished}
              className="btn-primary bg-emerald-600 hover:bg-emerald-700"
            >
              {finished ? "Submit test" : `Answer all to submit (${total - answered} left)`}
            </button>
          )}
        </div>

        <NavGrid
          total={total}
          current={index}
          answers={answers}
          questionIds={test.questions.map((x) => x.id)}
          onJump={setIndex}
        />
      </div>
    </div>
  );
}

function NavGrid({
  total,
  current,
  answers,
  questionIds,
  onJump,
}: {
  total: number;
  current: number;
  answers: Record<string, string>;
  questionIds: string[];
  onJump: (i: number) => void;
}) {
  return (
    <div className="card mt-6 p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">Question map</div>
      <div className="mt-2 grid grid-cols-10 gap-1.5">
        {questionIds.map((id, i) => {
          const answered = answers[id] !== undefined;
          const isCurrent = i === current;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onJump(i)}
              className={`flex h-8 items-center justify-center rounded text-[11px] font-semibold transition ${
                isCurrent
                  ? "bg-ink-900 text-white"
                  : answered
                  ? "bg-gulf-100 text-gulf-600 hover:bg-gulf-200"
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
