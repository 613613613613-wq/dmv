import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useContentPack, categoryName } from "../engine/contentPack";
import { useUserData } from "../engine/store";
import type { Lang, MockTestResult, Question } from "../types";
import { formatDuration, loc } from "../engine/util";
import { t } from "../i18n";
import Confetti from "../components/Confetti";

interface Snapshot {
  questionIds: string[];
  answers: Record<string, string>;
  result: MockTestResult;
  forcedByHearts?: boolean;
}

export default function MockResultView() {
  const { data } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { pack } = useContentPack(data.profile.vehicleClass);

  const snap = useMemo<Snapshot | null>(() => {
    try {
      const raw = sessionStorage.getItem("dmvprep.lastMock");
      return raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
      return null;
    }
  }, []);

  if (!pack) return <div className="card h-72 animate-pulse" />;
  if (!snap) return <Navigate to="/mock" replace />;

  const qById = new Map(pack.questions.map((q) => [q.id, q]));
  const items = snap.questionIds
    .map((id) => qById.get(id))
    .filter((q): q is Question => Boolean(q));
  const wrong = items.filter((q) => snap.answers[q.id] !== q.correct);
  const right = items.length - wrong.length;
  const pct = Math.round((right / Math.max(items.length, 1)) * 100);

  const topicTotals = new Map<string, { correct: number; total: number }>();
  for (const q of items) {
    const tn = topicTotals.get(q.category) ?? { correct: 0, total: 0 };
    tn.total += 1;
    if (snap.answers[q.id] === q.correct) tn.correct += 1;
    topicTotals.set(q.category, tn);
  }

  return (
    <div className="space-y-6">
      <Confetti show={snap.result.passed} count={140} />
      <section
        className={`overflow-hidden rounded-3xl p-6 text-white shadow-card md:p-8 ${
          snap.result.passed
            ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-gulf-600"
            : "bg-gradient-to-br from-coral-500 via-coral-600 to-ink-800"
        }`}
      >
        <div className="text-xs font-medium uppercase tracking-wider opacity-80">
          {t("mockTest", lang)}
        </div>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">
          {snap.result.passed ? t("youPassed", lang) : t("notYetKeepGoing", lang)}
        </h1>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm md:text-base">
          <span className="text-2xl font-bold md:text-3xl">
            {snap.result.score} / {snap.result.total}
          </span>
          <span className="opacity-90">{pct}%</span>
          <span className="opacity-80">· {formatDuration(snap.result.durationSeconds)}</span>
        </div>
        <p className="mt-3 max-w-xl text-sm opacity-90">
          {snap.result.passed
            ? lang === "es"
              ? `En el examen real ${pack.exam.officialName.es}, ${pack.exam.passingScore} de ${pack.exam.questionCount} (${pack.exam.passingPercent}%) es el mínimo. ¡Te darían el permiso!`
              : `On the real ${pack.exam.officialName.en}, ${pack.exam.passingScore} of ${pack.exam.questionCount} (${pack.exam.passingPercent}%) is the cutoff. You'd be issued the permit at this score.`
            : lang === "es"
              ? `Necesitas ${pack.exam.passingScore} de ${pack.exam.questionCount}. Repasa los temas abajo y vuelve a intentarlo.`
              : `On the real exam you'd need ${pack.exam.passingScore} of ${pack.exam.questionCount} to pass. Drill the topics below and try again.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/mock/exam" className="btn-primary bg-white text-ink-900 hover:bg-ink-100">
            {t("tryAgain", lang)}
          </Link>
          <Link to="/practice" className="btn-ghost text-white hover:bg-white/10">
            {t("practiceMode", lang)} →
          </Link>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">{t("byCategory", lang)}</h2>
        <ul className="mt-3 space-y-3">
          {Array.from(topicTotals.entries())
            .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
            .map(([cat, tn]) => {
              const acc = tn.correct / tn.total;
              return (
                <li key={cat}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-ink-900">{categoryName(pack, cat, lang)}</span>
                    <span className="text-xs text-ink-500">
                      {tn.correct} / {tn.total} · {Math.round(acc * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full ${
                        acc >= 0.8 ? "bg-emerald-400" : acc >= 0.6 ? "bg-sun-300" : "bg-coral-400"
                      }`}
                      style={{ width: `${Math.round(acc * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">
          {t("reviewYourMisses", lang)} {wrong.length === 0 ? "🎉" : `· ${wrong.length}`}
        </h2>
        {wrong.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">{t("noWrongNothingToReview", lang)}</p>
        ) : (
          <ul className="mt-4 space-y-5">
            {wrong.map((q) => {
              const chosen = snap.answers[q.id];
              const correctChoice = q.choices.find((c) => c.id === q.correct)!;
              const chosenChoice = q.choices.find((c) => c.id === chosen);
              return (
                <li key={q.id} className="border-t border-ink-100 pt-5 first:border-t-0 first:pt-0">
                  <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
                    {categoryName(pack, q.category, lang)}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-ink-900">
                    {loc(q.stem, lang)}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {chosenChoice && (
                      <div className="flex gap-2 rounded-lg bg-coral-400/10 p-2.5 text-coral-700">
                        <span className="font-bold">✗</span>
                        <span>{loc(chosenChoice.text, lang)}</span>
                      </div>
                    )}
                    <div className="flex gap-2 rounded-lg bg-emerald-50 p-2.5 text-emerald-900">
                      <span className="font-bold">✓</span>
                      <span>{loc(correctChoice.text, lang)}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">
                    {loc(q.explanation, lang)}
                  </p>
                  {q.handbookRef && (
                    <div className="mt-2 text-xs text-ink-500">
                      {pack.agency.name} · {q.handbookRef.section}
                      {q.handbookRef.page ? ` · p. ${q.handbookRef.page}` : ""}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
