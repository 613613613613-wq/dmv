import { Link } from "react-router-dom";
import { useContentPack, categoryName } from "../engine/contentPack";
import { useUserData } from "../engine/store";
import { loc } from "../engine/util";
import { t } from "../i18n";
import type { Lang } from "../types";

export default function BookmarksView() {
  const { data, toggleBookmark } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { pack } = useContentPack(data.profile.vehicleClass);
  if (!pack) return <div className="card h-72 animate-pulse" />;

  const qById = new Map(pack.questions.map((q) => [q.id, q]));
  const bookmarked = data.bookmarks
    .map((id) => qById.get(id))
    .filter((q): q is import("../types").Question => Boolean(q));

  if (bookmarked.length === 0) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-lg font-semibold text-ink-900">{t("saved", lang)}</h2>
        <p className="mt-2 text-sm text-ink-500">{t("noBookmarks", lang)}</p>
        <Link to="/practice" className="btn-primary mt-4">
          {t("beginPracticing", lang)}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-900">{t("saved", lang)}</h1>
        <p className="text-sm text-ink-500">{bookmarked.length}</p>
      </div>
      <ul className="space-y-3">
        {bookmarked.map((q) => {
          const correct = q.choices.find((c) => c.id === q.correct)!;
          return (
            <li key={q.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-ink-500">
                    {categoryName(pack, q.category)}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-ink-900">
                    {loc(q.stem, lang)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBookmark(q.id)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sun-50 text-sun-500"
                  aria-label={t("removeBookmark", lang)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 3h12v18l-6-4-6 4Z" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
                <span className="font-bold">✓ </span>
                {loc(correct.text, lang)}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                {loc(q.explanation, lang)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
