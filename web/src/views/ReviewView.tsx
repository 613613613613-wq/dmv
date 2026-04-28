import { Link } from "react-router-dom";
import { useContentPack, categoryName } from "../engine/contentPack";
import { useUserData } from "../engine/store";
import { dueCards } from "../engine/srs";
import { formatRelativeDate, loc } from "../engine/util";
import { t } from "../i18n";
import type { Lang, Question } from "../types";

export default function ReviewView() {
  const { data, toggleBookmark } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { pack } = useContentPack(data.profile.vehicleClass);
  if (!pack) return <div className="card h-72 animate-pulse" />;

  const qById = new Map(pack.questions.map((q) => [q.id, q]));

  const recent = [...data.attempts].slice(-30).reverse();

  const latestByQ = new Map<string, { correct: boolean; ts: number }>();
  for (const a of data.attempts) {
    latestByQ.set(a.questionId, { correct: a.correct, ts: a.timestamp });
  }
  const wrongIds = Array.from(latestByQ.entries())
    .filter(([, v]) => !v.correct)
    .sort((a, b) => b[1].ts - a[1].ts)
    .map(([id]) => id);

  const due = dueCards(data.srsCards)
    .sort((a, b) => a.dueDate - b.dueDate)
    .map((c) => qById.get(c.questionId))
    .filter((q): q is Question => Boolean(q));

  if (data.attempts.length === 0) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold text-ink-900">{t("noReview", lang)}</h2>
        <Link to="/practice" className="btn-primary mt-4">
          {t("beginPracticing", lang)}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">{t("review", lang)}</h1>
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">
            {t("dueForReview", lang)} · {due.length}
          </h2>
          {due.length > 0 && (
            <Link to="/practice" className="text-sm font-medium text-gulf-500 hover:text-gulf-600">
              {t("start", lang)} →
            </Link>
          )}
        </div>
        {due.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">{t("allCaughtUp", lang)}</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {due.slice(0, 8).map((q) => (
              <QuestionRow
                key={q.id}
                q={q}
                pack={pack}
                lang={lang}
                bookmarked={data.bookmarks.includes(q.id)}
                onBookmark={() => toggleBookmark(q.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">
          {lang === "es" ? "Errores" : "Mistakes"} · {wrongIds.length}
        </h2>
        {wrongIds.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">
            {lang === "es" ? "Sin errores pendientes. ¡Bien hecho!" : "No outstanding wrong answers. Nice work."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {wrongIds.slice(0, 12).map((id) => {
              const q = qById.get(id);
              if (!q) return null;
              return (
                <QuestionRow
                  key={id}
                  q={q}
                  pack={pack}
                  lang={lang}
                  bookmarked={data.bookmarks.includes(id)}
                  onBookmark={() => toggleBookmark(id)}
                  showCorrect
                />
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-ink-900">
          {lang === "es" ? "Actividad reciente" : "Recent activity"}
        </h2>
        <ul className="mt-3 divide-y divide-ink-100">
          {recent.map((a, i) => {
            const q = qById.get(a.questionId);
            if (!q) return null;
            return (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        a.correct ? "bg-emerald-100 text-emerald-700" : "bg-coral-400/15 text-coral-600"
                      }`}
                    >
                      {a.correct ? "✓" : "✗"}
                    </span>
                    <span className="truncate text-sm text-ink-700">{loc(q.stem, lang)}</span>
                  </div>
                  <div className="ml-7 mt-0.5 text-xs text-ink-500">
                    {categoryName(pack, q.category)} · {formatRelativeDate(a.timestamp)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function QuestionRow({
  q, pack, lang, bookmarked, onBookmark, showCorrect = false,
}: {
  q: Question;
  pack: import("../types").ContentPack;
  lang: string;
  bookmarked: boolean;
  onBookmark: () => void;
  showCorrect?: boolean;
}) {
  const correctChoice = q.choices.find((c) => c.id === q.correct);
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
            {categoryName(pack, q.category)}
          </div>
          <p className="mt-0.5 text-sm font-medium text-ink-900">{loc(q.stem, lang)}</p>
          {showCorrect && correctChoice && (
            <p className="mt-1 text-xs text-emerald-700">✓ {loc(correctChoice.text, lang)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onBookmark}
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition ${
            bookmarked ? "bg-sun-50 text-sun-500" : "text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          }`}
          aria-label="Bookmark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12v18l-6-4-6 4Z" />
          </svg>
        </button>
      </div>
    </li>
  );
}
