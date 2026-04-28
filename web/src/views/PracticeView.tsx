import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useContentPack } from "../engine/contentPack";
import { useUserData } from "../engine/store";
import { nextPracticeQuestion } from "../engine/practice";
import QuestionCard from "../components/QuestionCard";
import Confetti from "../components/Confetti";
import { t } from "../i18n";
import type { Lang, Question } from "../types";

export default function PracticeView() {
  const { data, recordAttempt, toggleBookmark } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { pack } = useContentPack(data.profile.vehicleClass);
  const [params, setParams] = useSearchParams();
  const filterCategory = params.get("category") ?? undefined;

  const recentRef = useRef<Set<string>>(new Set());
  const [question, setQuestion] = useState<Question | null>(null);
  const [sessionStats, setSessionStats] = useState({ answered: 0, correct: 0 });
  const [confetti, setConfetti] = useState(false);

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

  if (!pack) return <div className="card h-72 animate-pulse" />;

  if (!question) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-ink-900">
          {lang === "es" ? "Aún no hay preguntas para este tema." : "No questions for this topic yet."}
        </h2>
        <Link to="/practice" className="btn-secondary mt-4">
          {t("practiceAll", lang)}
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
    if (isCorrect) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 800);
    }
  }

  function handleNext() {
    if (!pack || !question) return;
    recentRef.current.add(question.id);
    if (recentRef.current.size > 10) {
      const arr = Array.from(recentRef.current);
      recentRef.current = new Set(arr.slice(arr.length - 10));
    }
    const next = nextPracticeQuestion(pack, data, recentRef.current, filterCategory);
    setQuestion(next);
  }

  return (
    <div className="space-y-4">
      <Confetti show={confetti} count={20} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
            {t("practiceMode", lang)}
          </div>
          <h1 className="text-xl font-bold text-ink-900">
            {categoryLabel ? categoryLabel : t("adaptivePractice", lang)}
          </h1>
          <p className="text-sm text-ink-500">
            {categoryLabel
              ? lang === "es"
                ? "Repasando solo este tema."
                : "Drilling just this topic."
              : t("adaptivePracticeBlurb", lang)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-ink-500">{t("thisSession", lang)}</div>
            <div className="text-sm font-semibold text-ink-900">
              {sessionStats.correct} / {sessionStats.answered}
            </div>
          </div>
          {filterCategory && (
            <button
              type="button"
              onClick={() => setParams({})}
              className="btn-ghost text-xs"
            >
              {lang === "es" ? "Quitar tema" : "Clear topic"}
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
        <span>{t("questionId", lang)} · {question.id}</span>
        <span>{pack.questions.length} {t("inThisPack", lang)}</span>
      </div>
    </div>
  );
}
