import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useContentPack } from "../engine/contentPack";
import { useUserData } from "../engine/store";
import { nextPracticeQuestion } from "../engine/practice";
import QuestionCard from "../components/QuestionCard";
import type { Question } from "../types";

export default function PracticeView() {
  const { pack } = useContentPack();
  const { data, recordAttempt, toggleBookmark } = useUserData();
  const [params, setParams] = useSearchParams();
  const filterCategory = params.get("category") ?? undefined;

  const recentRef = useRef<Set<string>>(new Set());
  const [question, setQuestion] = useState<Question | null>(null);
  const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0 });

  // Pick the first/next question whenever the pack or filter changes.
  useEffect(() => {
    if (!pack) return;
    recentRef.current = new Set();
    setSessionStats({ answered: 0, correct: 0 });
    const q = nextPracticeQuestion(pack, data, recentRef.current, filterCategory);
    setQuestion(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack, filterCategory]);

  const categoryLabel = useMemo(() => {
    if (!filterCategory || !pack) return null;
    return pack.categories.find((c) => c.id === filterCategory)?.name ?? null;
  }, [pack, filterCategory]);

  if (!pack) {
    return <div className="card h-72 animate-pulse" />;
  }

  if (!question) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-ink-900">No questions for this topic yet.</h2>
        <Link to="/practice" className="btn-secondary mt-4">
          Practice all topics
        </Link>
      </div>
    );
  }

  function handleAnswer(_choiceId: string, isCorrect: boolean, timeSpentSeconds: number) {
    if (!question) return;
    recordAttempt(question.id, isCorrect, timeSpentSeconds);
    setSessionStats((s) => ({
      answered: s.answered + 1,
      correct: s.correct + (isCorrect ? 1 : 0),
    }));
  }

  function handleNext() {
    if (!pack || !question) return;
    recentRef.current.add(question.id);
    if (recentRef.current.size > 10) {
      // Cap recently-seen so we don't run out of variety in a tiny pack.
      const arr = Array.from(recentRef.current);
      recentRef.current = new Set(arr.slice(arr.length - 10));
    }
    const next = nextPracticeQuestion(pack, data, recentRef.current, filterCategory);
    setQuestion(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
            Practice mode
          </div>
          <h1 className="text-xl font-bold text-ink-900">
            {categoryLabel ? categoryLabel : "Adaptive practice"}
          </h1>
          <p className="text-sm text-ink-500">
            {categoryLabel
              ? "Drilling just this topic — no SRS bias."
              : "Picks from your weakest topics and questions you're about to forget."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-ink-500">This session</div>
            <div className="text-sm font-semibold text-ink-900">
              {sessionStats.correct} / {sessionStats.answered} correct
            </div>
          </div>
          {filterCategory && (
            <button
              type="button"
              onClick={() => setParams({})}
              className="btn-ghost text-xs"
            >
              Clear topic
            </button>
          )}
        </div>
      </div>

      <QuestionCard
        pack={pack}
        question={question}
        data={data}
        mode="practice"
        onAnswer={handleAnswer}
        onBookmark={() => toggleBookmark(question.id)}
        onNext={handleNext}
      />

      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>Question id · {question.id}</span>
        <span>{pack.questions.length} questions in this pack</span>
      </div>
    </div>
  );
}
