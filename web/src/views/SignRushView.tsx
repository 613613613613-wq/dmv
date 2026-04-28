import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserData } from "../engine/store";
import { t } from "../i18n";
import Sign from "../components/Sign";
import Confetti from "../components/Confetti";
import { shuffle } from "../engine/util";
import { getSigns } from "./SignsView";
import type { Lang } from "../types";

const ROUND_SECONDS = 60;
const HEARTS_START = 3;

interface Round {
  signIdx: number;
  options: number[]; // indices into SIGNS
}

export default function SignRushView() {
  const navigate = useNavigate();
  const { data, recordSignRush } = useUserData();
  const lang = (data.profile.language ?? "en") as Lang;
  const SIGNS = getSigns();

  const [stage, setStage] = useState<"intro" | "play" | "over">("intro");
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(HEARTS_START);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [round, setRound] = useState<Round | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const [confetti, setConfetti] = useState(false);
  const submittedRef = useRef(false);

  const buildRound = useMemo(
    () => () => {
      const signIdx = Math.floor(Math.random() * SIGNS.length);
      const distractors = shuffle(SIGNS.map((_, i) => i).filter((i) => i !== signIdx)).slice(0, 3);
      const options = shuffle([signIdx, ...distractors]);
      return { signIdx, options };
    },
    [SIGNS],
  );

  function start() {
    submittedRef.current = false;
    setStage("play");
    setScore(0);
    setHearts(HEARTS_START);
    setSecondsLeft(ROUND_SECONDS);
    setChosen(null);
    setFeedback(null);
    setRound(buildRound());
  }

  function endGame(finalScore: number) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    recordSignRush(finalScore);
    setStage("over");
  }

  // Timer
  useEffect(() => {
    if (stage !== "play") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setScore((sc) => {
            endGame(sc);
            return sc;
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function pick(optionIdx: number) {
    if (chosen !== null || !round) return;
    setChosen(optionIdx);
    const correct = optionIdx === round.signIdx;
    if (correct) {
      setScore((s) => s + 1);
      setFeedback("good");
      setConfetti(true);
      setTimeout(() => setConfetti(false), 600);
    } else {
      setFeedback("bad");
      setHearts((h) => {
        const nh = h - 1;
        if (nh <= 0) {
          setScore((sc) => {
            endGame(sc);
            return sc;
          });
        }
        return nh;
      });
    }
    setTimeout(() => {
      setChosen(null);
      setFeedback(null);
      setRound(buildRound());
    }, 700);
  }

  if (stage === "intro") {
    return (
      <div className="card p-8 text-center">
        <div className="mb-3 text-6xl">⚡</div>
        <h1 className="text-2xl font-bold text-ink-900">{t("signRush", lang)}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-ink-600">
          {lang === "es"
            ? "Identifica tantas señales como puedas en 60 segundos. Tienes 3 vidas. ¡Cada acierto te da 5 XP!"
            : "Identify as many signs as you can in 60 seconds. You have 3 hearts. Every correct answer is 5 XP!"}
        </p>
        <div className="mt-6 inline-flex items-baseline gap-3 rounded-2xl bg-sun-50 px-5 py-3">
          <span className="text-xs uppercase tracking-wider text-sun-700">{t("bestScore", lang)}</span>
          <span className="text-2xl font-bold text-sun-700">{data.bestSignRush}</span>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={start} className="btn-primary px-8">
            {t("letsGo", lang)} →
          </button>
          <button type="button" onClick={() => navigate("/signs")} className="btn-secondary">
            ← {t("back", lang)}
          </button>
        </div>
      </div>
    );
  }

  if (stage === "over") {
    const isRecord = score >= data.bestSignRush && score > 0;
    return (
      <div className="space-y-4">
        <Confetti show={isRecord} count={120} />
        <div
          className={`overflow-hidden rounded-3xl p-6 text-white shadow-card md:p-8 ${
            isRecord
              ? "bg-gradient-to-br from-sun-400 via-coral-500 to-coral-600"
              : "bg-gradient-to-br from-ink-800 via-ink-900 to-gulf-700"
          }`}
        >
          <div className="text-xs font-medium uppercase tracking-wider opacity-80">
            {t("signRush", lang)}
          </div>
          <h1 className="mt-1 text-3xl font-bold">
            {isRecord ? t("newRecord", lang) : t("yourFinalScore", lang)}
          </h1>
          <div className="mt-4 text-6xl font-black">{score}</div>
          <p className="mt-2 text-sm opacity-90">
            +{score * 5} XP · {t("bestScore", lang)} {Math.max(score, data.bestSignRush)}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={start} className="btn-primary bg-white text-ink-900 hover:bg-ink-100">
              {t("tryAgain", lang)}
            </button>
            <Link to="/signs" className="btn-ghost text-white hover:bg-white/10">
              ← {t("signGallery", lang)}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  if (!round) return null;
  const sign = SIGNS[round.signIdx];

  return (
    <div className="space-y-5">
      <Confetti show={confetti} count={20} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Array.from({ length: HEARTS_START }).map((_, i) => (
            <span key={i} className={`text-xl ${i < hearts ? "" : "grayscale opacity-30"}`}>
              ❤️
            </span>
          ))}
        </div>
        <div
          className={`flex items-baseline gap-1 rounded-full px-3 py-1 font-mono text-sm font-bold tabular-nums ${
            secondsLeft <= 10 ? "bg-coral-500 text-white" : "bg-ink-900 text-white"
          }`}
        >
          <span>{secondsLeft}</span>
          <span className="text-[10px] font-medium opacity-70">s</span>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
            {t("score", lang)}
          </div>
          <div className="text-lg font-bold text-ink-900">{score}</div>
        </div>
      </div>

      <div
        className={`card flex flex-col items-center p-8 transition ${
          feedback === "good" ? "ring-2 ring-emerald-400" : feedback === "bad" ? "ring-2 ring-coral-400" : ""
        }`}
      >
        <div className="text-xs font-medium uppercase tracking-wider text-gulf-600">
          {t("identifyTheSign", lang)}
        </div>
        <div className="mt-4">
          <Sign kind={sign.kind} size={160} speedValue={sign.speedValue} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {round.options.map((optIdx) => {
          const opt = SIGNS[optIdx];
          const isCorrect = optIdx === round.signIdx;
          const isChosen = chosen === optIdx;
          let tone =
            "bg-white text-ink-900 ring-ink-200 hover:ring-ink-400 hover:bg-ink-50";
          if (chosen !== null) {
            if (isCorrect) tone = "bg-emerald-50 text-emerald-900 ring-emerald-300";
            else if (isChosen) tone = "bg-coral-400/10 text-coral-700 ring-coral-400";
            else tone = "bg-white text-ink-500 ring-ink-100";
          }
          return (
            <button
              key={optIdx}
              type="button"
              onClick={() => pick(optIdx)}
              disabled={chosen !== null}
              className={`rounded-xl px-4 py-3 text-left text-sm font-medium ring-1 transition ${tone}`}
            >
              {opt.label[lang]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
