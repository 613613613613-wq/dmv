import { useEffect, useState } from "react";
import type { Lang, Question, ContentPack, UserData } from "../types";
import { categoryName } from "../engine/contentPack";
import { loc } from "../engine/util";
import { t } from "../i18n";
import Sign from "./Sign";

type Mode = "practice" | "exam";

interface Props {
  pack: ContentPack;
  question: Question;
  data: UserData;
  mode: Mode;
  selectedId?: string | null;
  onAnswer: (choiceId: string, isCorrect: boolean, timeSpentSeconds: number) => void;
  onBookmark?: () => void;
  onNext?: () => void;
  showHandbook?: boolean;
  questionIndex?: number;
  questionTotal?: number;
}

export default function QuestionCard({
  pack,
  question,
  data,
  mode,
  selectedId = null,
  onAnswer,
  onBookmark,
  onNext,
  showHandbook = true,
  questionIndex,
  questionTotal,
}: Props) {
  const lang = (data.profile.language ?? "en") as Lang;
  const [chosen, setChosen] = useState<string | null>(selectedId);
  const [shownAt, setShownAt] = useState<number>(() => Date.now());
  const bookmarked = data.bookmarks.includes(question.id);

  useEffect(() => {
    setChosen(selectedId);
    setShownAt(Date.now());
  }, [question.id, selectedId]);

  const isExam = mode === "exam";
  const showFeedback = !isExam && chosen !== null;

  function handlePick(choiceId: string) {
    if (chosen !== null) return;
    setChosen(choiceId);
    const seconds = Math.max(0.1, (Date.now() - shownAt) / 1000);
    onAnswer(choiceId, choiceId === question.correct, seconds);
  }

  return (
    <div className={`card p-5 md:p-7 transition ${
      showFeedback && chosen === question.correct
        ? "ring-2 ring-emerald-300"
        : showFeedback
        ? "ring-2 ring-coral-300"
        : ""
    }`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-gulf-50 text-gulf-600">{categoryName(pack, question.category, lang)}</span>
          <span className="chip">
            <DifficultyDots level={question.difficulty} />
            <span className="ml-1">
              {question.difficulty <= 1
                ? t("difficultyEasy", lang)
                : question.difficulty <= 2
                ? t("difficultyMedium", lang)
                : t("difficultyHard", lang)}
            </span>
          </span>
          {questionIndex !== undefined && questionTotal !== undefined && (
            <span className="chip bg-ink-50 text-ink-600">
              {questionIndex + 1} / {questionTotal}
            </span>
          )}
        </div>
        {onBookmark && (
          <button
            type="button"
            onClick={onBookmark}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              bookmarked ? "bg-sun-50 text-sun-500" : "text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            }`}
            aria-label={bookmarked ? t("removeBookmark", lang) : t("addBookmark", lang)}
          >
            <BookmarkIcon filled={bookmarked} />
          </button>
        )}
      </div>

      {question.signKind && (
        <div className="mt-5 flex justify-center rounded-2xl bg-gradient-to-b from-ink-50 to-white p-4 ring-1 ring-ink-100">
          <Sign
            kind={question.signKind}
            speedValue={question.signValue}
            size={132}
            className="drop-shadow-md"
          />
        </div>
      )}

      <h2 className="mt-4 text-lg font-semibold leading-snug text-ink-900 md:text-xl">
        {loc(question.stem, lang)}
      </h2>

      <ul className="mt-5 space-y-2">
        {question.choices.map((c) => {
          const isChosen = chosen === c.id;
          const isCorrect = c.id === question.correct;
          let tone = "bg-white text-ink-900 ring-ink-200 hover:ring-ink-400 hover:bg-ink-50";
          if (showFeedback) {
            if (isCorrect) tone = "bg-emerald-50 text-emerald-900 ring-emerald-300";
            else if (isChosen) tone = "bg-coral-400/10 text-coral-700 ring-coral-400";
            else tone = "bg-white text-ink-500 ring-ink-100";
          } else if (isExam && isChosen) {
            tone = "bg-ink-900 text-white ring-ink-900";
          }
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => handlePick(c.id)}
                disabled={chosen !== null && !isExam}
                className={`group flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ring-1 transition ${tone} ${
                  showFeedback && isCorrect ? "scale-[1.02]" : ""
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ${
                    showFeedback && isCorrect
                      ? "bg-emerald-500 text-white ring-emerald-500"
                      : showFeedback && isChosen
                      ? "bg-coral-500 text-white ring-coral-500"
                      : isExam && isChosen
                      ? "bg-white text-ink-900 ring-white"
                      : "bg-ink-50 text-ink-700 ring-ink-200"
                  }`}
                >
                  {showFeedback && isCorrect ? "✓" : showFeedback && isChosen ? "✗" : c.id.toUpperCase()}
                </span>
                <span className="flex-1 leading-snug">{loc(c.text, lang)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {showFeedback && (
        <div
          className={`mt-5 rounded-xl p-4 text-sm ${
            chosen === question.correct
              ? "bg-emerald-50 text-emerald-900"
              : "bg-sun-50 text-ink-800"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-lg">{chosen === question.correct ? "🎉" : "💡"}</span>
            {chosen === question.correct ? t("correct", lang) : t("notQuite", lang)}
            {chosen === question.correct && (
              <span className="ml-auto text-xs font-bold text-emerald-700">+10 XP</span>
            )}
          </div>
          <p className="mt-1 leading-relaxed">{loc(question.explanation, lang)}</p>
          {showHandbook && question.handbookRef && (
            <div className="mt-3 flex items-center gap-2 border-t border-current/10 pt-3 text-xs">
              <BookOpenIcon />
              <span className="font-medium">{pack.agency.name} · {question.handbookRef.section}</span>
              {question.handbookRef.page && <span>· p. {question.handbookRef.page}</span>}
            </div>
          )}
          {onNext && (
            <button type="button" onClick={onNext} className="btn-primary mt-4">
              {t("nextQuestion", lang)} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DifficultyDots({ level }: { level: number }) {
  const total = 3;
  const filled = Math.min(total, Math.max(1, Math.ceil(level / 2)));
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < filled ? "bg-ink-700" : "bg-ink-300"}`}
        />
      ))}
    </span>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-6-4-6 4Z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3Z" />
      <path d="M21 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8Z" />
    </svg>
  );
}
