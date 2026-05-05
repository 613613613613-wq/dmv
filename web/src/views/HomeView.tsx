import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useUserData, levelInfo } from "../engine/store";
import { useContentPack, useLessonPack } from "../engine/contentPack";
import { currentStreak, longestStreak, studiedToday } from "../engine/streak";
import { categoryStats } from "../engine/practice";
import { dueCards } from "../engine/srs";
import { hasGeneratedVideo } from "../engine/videoAssets";
import { t } from "../i18n";
import { loc } from "../engine/util";
import type { Lang } from "../types";

export default function HomeView() {
  const { data } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const { pack, error } = useContentPack(data.profile.vehicleClass);
  const { lessons } = useLessonPack(data.profile.vehicleClass);

  if (error) return <ErrorPanel message={error} lang={lang} />;
  if (!pack) return <Skeleton />;

  const streak = currentStreak(data.attempts);
  const longest = longestStreak(data.attempts);
  const today = studiedToday(data.attempts);
  const stats = categoryStats(pack, data);
  const totalAttempts = data.attempts.length;
  const totalCorrect = data.attempts.filter((a) => a.correct).length;
  const overallAcc = totalAttempts === 0 ? 0 : totalCorrect / totalAttempts;
  const due = dueCards(data.srsCards).length;
  const lastResult = data.mockResults[0];
  const lvl = levelInfo(data.xp);
  const nextLesson = lessons?.lessons.find((l) => !data.lessonsCompleted.includes(l.id));

  // Count of animated clips that are (a) actually referenced by a lesson step
  // for the user's vehicle class AND (b) actually generated and watchable.
  // This number is stable: it only changes when lesson content changes, NOT
  // every time the video-generation worker writes a new MP4 to the manifest.
  // Fixes the "27 → 37 → climbing" mismatch the user saw in dev/HMR.
  const watchableClipCount = useMemo(() => {
    if (!lessons) return 0;
    const scenes = new Set<string>();
    for (const lesson of lessons.lessons) {
      for (const step of lesson.steps) {
        if (step.scene && hasGeneratedVideo(step.scene)) {
          scenes.add(step.scene);
        }
      }
    }
    return scenes.size;
  }, [lessons]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-gulf-600 p-6 text-white shadow-card md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-sun-200">
              {pack.agency.name} · {pack.exam.officialName}
            </div>
            <h1 className="text-2xl font-bold leading-tight md:text-4xl">
              {t("heroHeadline", lang).trimEnd().split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="max-w-md text-sm text-ink-200 md:text-base">
              {pack.exam.questionCount} {t("questions", lang)} · {pack.exam.passingPercent}% {t("passMark", lang).toLowerCase()} ·{" "}
              {t("everyAnswerCitesHandbook", lang)}
            </p>
            {watchableClipCount > 0 && (
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-sun-200 ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
              >
                <span aria-hidden>▶</span>
                <span>
                  {watchableClipCount} {t("animatedClipsInLessons", lang)} →
                </span>
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            {nextLesson && (
              <Link
                to={`/learn/${nextLesson.id}`}
                className="btn-primary bg-sun-300 text-ink-900 hover:bg-sun-200"
              >
                {t("beginLesson", lang)} →
              </Link>
            )}
            <Link to="/practice" className="text-sm font-medium text-sun-200 hover:text-white">
              {t("beginPracticing", lang)} →
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <StatCard
          label={t("dayStreak", lang)}
          value={String(streak)}
          sub={today ? t("studiedToday", lang) : t("studyTodayKeep", lang)}
          tone={today ? "good" : "warn"}
        />
        <StatCard
          label={`${t("level", lang)} ${lvl.level}`}
          value={`${data.xp} XP`}
          sub={`${lvl.needed - lvl.into} ${t("toNextLevel", lang)}`}
          tone="good"
        />
        <StatCard
          label={t("dueForReview", lang)}
          value={String(due)}
          sub={due > 0 ? t("scheduledBySrs", lang) : t("allCaughtUp", lang)}
          tone={due > 0 ? "warn" : "good"}
        />
        <StatCard
          label={t("questionsAnswered", lang)}
          value={String(totalAttempts)}
          sub={`${Math.round(overallAcc * 100)}% ${t("accuracy", lang)}`}
        />
      </section>

      {nextLesson && (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-sun-100 to-coral-100 p-5 ring-1 ring-sun-200">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white text-3xl shadow-card">
              {nextLesson.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wider text-coral-700">
                {t("learn", lang)}
              </div>
              <h3 className="mt-0.5 truncate text-base font-bold text-ink-900">
                {loc(nextLesson.title, lang)}
              </h3>
              <p className="truncate text-sm text-ink-600">{loc(nextLesson.blurb, lang)}</p>
            </div>
            <Link
              to={`/learn/${nextLesson.id}`}
              className="btn-primary bg-ink-900 text-white"
            >
              +{nextLesson.xpReward} XP
            </Link>
          </div>
        </section>
      )}

      {lastResult && (
        <section className="card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                {t("mockTest", lang)}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-ink-900">
                  {lastResult.score} / {lastResult.total}
                </span>
                <span
                  className={`chip ${
                    lastResult.passed
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-coral-400/10 text-coral-600"
                  }`}
                >
                  {lastResult.passed ? t("passed", lang) : t("didNotPass", lang)}
                </span>
              </div>
              <div className="mt-1 text-sm text-ink-500">
                {lang === "es"
                  ? `Necesitas ${pack.exam.passingScore} de ${pack.exam.questionCount} para aprobar.`
                  : `Need ${pack.exam.passingScore} of ${pack.exam.questionCount} to pass on the real exam.`}
              </div>
            </div>
            <Link to="/mock" className="btn-secondary">
              {t("tryAgain", lang)}
            </Link>
          </div>
        </section>
      )}

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-900">{t("topics", lang)}</h2>
          <Link to="/practice" className="text-sm font-medium text-gulf-500 hover:text-gulf-600">
            {t("practiceAll", lang)} →
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {pack.categories.map((cat) => {
            const s = stats.find((x) => x.categoryId === cat.id)!;
            const totalQs = pack.questions.filter((q) => q.category === cat.id).length;
            return (
              <Link
                key={cat.id}
                to={`/practice?category=${cat.id}`}
                className="flex items-center gap-4 rounded-xl p-2 -m-2 transition hover:bg-ink-50"
              >
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-ink-900">{cat.name}</span>
                    <span className="text-xs text-ink-500">
                      {s.attempts === 0
                        ? `${totalQs} ${
                            totalQs === 1
                              ? lang === "es" ? "pregunta" : "question"
                              : lang === "es" ? "preguntas" : "questions"
                          }`
                        : `${Math.round(s.accuracy * 100)}%`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full ${
                        s.attempts === 0
                          ? "bg-ink-200"
                          : s.accuracy >= 0.8
                          ? "bg-emerald-400"
                          : s.accuracy >= 0.6
                          ? "bg-sun-300"
                          : "bg-coral-400"
                      }`}
                      style={{
                        width: `${s.attempts === 0 ? Math.round(cat.weight * 100) : Math.round(s.accuracy * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/signs" className="card p-5 text-left transition hover:-translate-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-gulf-600">
            {t("signs", lang)} · {t("signRush", lang)} ⚡
          </div>
          <h3 className="mt-1 text-base font-semibold text-ink-900">{t("signsTitle", lang)}</h3>
          <p className="mt-1 text-sm text-ink-600">{t("signsBlurb", lang)}</p>
          <div className="mt-3 inline-flex items-baseline gap-2 text-sm">
            <span className="font-bold text-coral-600">{t("bestScore", lang)}:</span>
            <span className="font-bold text-ink-900">{data.bestSignRush}</span>
          </div>
        </Link>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-ink-900">{t("floridaInRules", lang)}</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            {pack.specialNotes.slice(0, 4).map((n) => (
              <li key={n} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gulf-400" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="pb-4 text-center text-[11px] text-ink-400">
        {t("bilingual", lang)} · {pack.handbook.version}
      </p>
    </div>
  );
}

function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink-900">{value}</div>
      {sub && (
        <div
          className={`mt-1 text-xs ${
            tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-coral-500" : "text-ink-500"
          }`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-3xl bg-ink-100" />
      <div className="grid gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-100" />
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ message, lang }: { message: string; lang: Lang }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-coral-600">{t("couldntLoadPack", lang)}</h2>
      <p className="mt-2 text-sm text-ink-600">{message}</p>
    </div>
  );
}
