import { Link } from "react-router-dom";
import { useUserData } from "../engine/store";
import { useLessonPack } from "../engine/contentPack";
import { t } from "../i18n";
import { loc } from "../engine/util";
import type { Lang } from "../types";

export default function LearnView() {
  const { data } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { lessons, error } = useLessonPack(data.profile.vehicleClass);

  if (error)
    return (
      <div className="card p-6 text-coral-600">
        Couldn't load lessons: {error}
      </div>
    );
  if (!lessons) return <div className="card h-72 animate-pulse" />;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-ink-900">{t("lessons", lang)}</h1>
        <p className="text-sm text-ink-500">{t("lessonsBlurb", lang)}</p>
      </header>
      <ol className="grid gap-3">
        {lessons.lessons.map((lesson, i) => {
          const done = data.lessonsCompleted.includes(lesson.id);
          return (
            <li key={lesson.id}>
              <Link
                to={`/learn/${lesson.id}`}
                className={`group flex items-center gap-4 rounded-2xl p-5 ring-1 transition hover:-translate-y-0.5 ${
                  done
                    ? "bg-emerald-50 ring-emerald-200"
                    : "bg-white ring-ink-100 hover:ring-ink-300"
                }`}
              >
                <div
                  className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-3xl ${
                    done ? "bg-emerald-500/15" : "bg-gulf-50"
                  }`}
                >
                  {done ? "✓" : lesson.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-500">
                    <span>
                      {lang === "es" ? "Lección" : "Lesson"} {i + 1}
                    </span>
                    {done && (
                      <span className="chip bg-emerald-500/15 text-emerald-700">
                        {t("completed", lang)}
                      </span>
                    )}
                    <span className="chip bg-sun-50 text-sun-600">+{lesson.xpReward} XP</span>
                  </div>
                  <h3 className="mt-0.5 text-base font-semibold text-ink-900">
                    {loc(lesson.title, lang)}
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-500">{loc(lesson.blurb, lang)}</p>
                </div>
                <span className="text-xl text-ink-400 transition group-hover:translate-x-1">→</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
