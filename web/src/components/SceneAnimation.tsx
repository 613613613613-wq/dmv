import { useEffect, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import type { Lang, SignKind } from "../types";
import Sign from "./Sign";
import { hasGeneratedVideo, sceneVideoUrl } from "../engine/videoAssets";

interface Props {
  scene: string;
  lang: Lang;
  fallbackSign?: SignKind;
  fallbackSignValue?: number;
}

export default function SceneAnimation(props: Props) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  // Reset both states whenever the scene changes — without this, a single
  // failed video would force the inline animation fallback for every
  // subsequent step in the same lesson (component instance is reused),
  // and the loading shimmer would be skipped on subsequent step changes.
  useEffect(() => {
    setVideoFailed(false);
    setVideoLoaded(false);
  }, [props.scene]);
  const hasVideo = hasGeneratedVideo(props.scene);

  if (hasVideo && !videoFailed) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gulf-100 via-sun-50 to-coral-100 ring-1 ring-ink-100 aspect-[16/9]">
        {!videoLoaded && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            role="status"
            aria-label={props.lang === "es" ? "Cargando video" : "Loading video"}
          >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gulf-300 border-t-gulf-600" />
          </div>
        )}
        <video
          key={props.scene}
          src={sceneVideoUrl(props.scene)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoFailed(true)}
        />
      </div>
    );
  }

  // Honors the user's prefers-reduced-motion setting: framer-motion will skip
  // transform animations (translate/scale/rotate) and only keep opacity changes,
  // leaving each scene visible in its final, accessible state.
  return (
    <MotionConfig reducedMotion="user">
      <SceneInner {...props} />
    </MotionConfig>
  );
}

function SceneInner({ scene, lang, fallbackSign, fallbackSignValue }: Props) {
  const [kind, ...rest] = scene.split(":");
  const param = rest.join(":");

  const labels = TEXT[lang];

  switch (kind) {
    case "sign-spotlight":
      return <SignSpotlight sign={(param as SignKind) || fallbackSign || "stop"} value={fallbackSignValue} />;
    case "speedometer":
      return <Speedometer target={Number(param) || 30} unit={labels.mph} />;
    case "four-way-stop":
      return <FourWayStop labels={labels} />;
    case "t-intersection":
      return <TIntersection labels={labels} />;
    case "left-turn-yield":
      return <LeftTurnYield labels={labels} />;
    case "ped-crosswalk":
      return <PedCrosswalk labels={labels} />;
    case "bac":
      return <BACScale value={Number(param)} labels={labels} />;
    case "siren":
      return <Siren labels={labels} />;
    case "school-bus":
      return <SchoolBus labels={labels} />;
    case "move-over":
      return <MoveOver labels={labels} />;
    case "timeline":
      return <Timeline highlight={Number(param) || 1} lang={lang} />;
    case "gear":
      return <GearItem which={param || "helmet"} labels={labels} />;
    case "bike-control":
      return <BikeControl which={param || "right-hand"} labels={labels} />;
    case "corner":
      return <CornerPhase step={Number(param) || 1} labels={labels} />;
    case "mc-law":
      return <MotorcycleLaw kind={param || "helmet"} labels={labels} />;
    case "walkaround":
      return <WalkAround step={Number(param) || 1} labels={labels} />;
    case "air":
      return <AirSystem kind={param || "compressor"} labels={labels} />;
    case "cdl-disqual":
      return <CDLDisqual kind={param || "first"} labels={labels} />;
    case "license-revoke":
      return <LicenseRevoke labels={labels} />;
    default:
      return fallbackSign ? (
        <div className="flex justify-center">
          <Sign kind={fallbackSign} size={180} speedValue={fallbackSignValue} />
        </div>
      ) : null;
  }
}

const TEXT = {
  en: {
    mph: "mph",
    you: "YOU",
    yield: "YIELD",
    stop: "STOP",
    go: "GO",
    wait: "WAIT",
    pedestrian: "PEDESTRIAN",
    siren: "SIREN",
    pullRight: "PULL RIGHT",
    schoolBus: "SCHOOL BUS",
    moveOver: "MOVE OVER",
    helmet: "HELMET",
    eyes: "EYES",
    body: "JACKET · PANTS · GLOVES · BOOTS",
    visibility: "BE SEEN",
    rightHand: "RIGHT HAND",
    leftHand: "LEFT HAND",
    rightFoot: "RIGHT FOOT",
    leftFoot: "LEFT FOOT",
    throttle: "Throttle + Front Brake",
    clutch: "Clutch",
    rearBrake: "Rear Brake",
    shifter: "Shifter",
    slow: "SLOW",
    look: "LOOK",
    press: "PRESS",
    roll: "ROLL",
    psi: "psi",
    compressor: "Compressor",
    warning: "LOW PRESSURE",
    spring: "Spring Brakes",
    fade: "Brake Fade",
    suspended: "SUSPENDED",
    revoked: "REVOKED",
    firstOffense: "1 Year",
    secondOffense: "LIFETIME",
    serious: "Serious Violations",
    helmetReq: "Helmet required (under 21)",
    laneSplit: "No lane-splitting",
    headlightOn: "Headlight always ON",
    brc: "Take the BRC",
    tlsae: "TLSAE (4 hrs)",
    permit: "Learner's Permit",
    months3: "3 months daylight",
    months12: "12 months → Class E",
    inspect: "Inspect",
  },
  es: {
    mph: "mph",
    you: "TÚ",
    yield: "CEDA",
    stop: "ALTO",
    go: "AVANZA",
    wait: "ESPERA",
    pedestrian: "PEATÓN",
    siren: "SIRENA",
    pullRight: "ORÍLLATE",
    schoolBus: "BUS ESCOLAR",
    moveOver: "MUÉVETE",
    helmet: "CASCO",
    eyes: "OJOS",
    body: "CHAQUETA · PANTALÓN · GUANTES · BOTAS",
    visibility: "QUE TE VEAN",
    rightHand: "MANO DER.",
    leftHand: "MANO IZQ.",
    rightFoot: "PIE DER.",
    leftFoot: "PIE IZQ.",
    throttle: "Acelerador + Freno Delantero",
    clutch: "Embrague",
    rearBrake: "Freno Trasero",
    shifter: "Cambios",
    slow: "FRENA",
    look: "MIRA",
    press: "PRESIONA",
    roll: "ACELERA",
    psi: "psi",
    compressor: "Compresor",
    warning: "BAJA PRESIÓN",
    spring: "Frenos de Resorte",
    fade: "Pérdida de Frenado",
    suspended: "SUSPENDIDO",
    revoked: "REVOCADO",
    firstOffense: "1 Año",
    secondOffense: "DE POR VIDA",
    serious: "Faltas Graves",
    helmetReq: "Casco obligatorio (-21)",
    laneSplit: "No filtrar carriles",
    headlightOn: "Faro siempre ENCENDIDO",
    brc: "Toma el BRC",
    tlsae: "TLSAE (4 hrs)",
    permit: "Licencia de Aprendiz",
    months3: "3 meses de día",
    months12: "12 meses → Clase E",
    inspect: "Inspecciona",
  },
};

type Labels = typeof TEXT.en;

function Stage({ children, ratio = "aspect-[16/9]" }: { children: React.ReactNode; ratio?: string }) {
  return (
    <div className={`relative w-full ${ratio} overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 ring-1 ring-ink-100`}>
      {children}
    </div>
  );
}

function Road({ y = "70%", height = "30%" }: { y?: string; height?: string }) {
  return (
    <>
      <div className="absolute inset-x-0 bg-ink-700" style={{ top: y, height }} />
      <motion.div
        className="absolute left-0 right-0 h-1 bg-sun-300"
        style={{ top: `calc(${y} + ${parseFloat(height) / 2}% - 2px)` }}
        initial={{ backgroundPosition: "0 0" }}
        animate={{ backgroundPosition: ["0 0", "60px 0"] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      >
        <div className="h-full w-full" style={{ backgroundImage: "linear-gradient(90deg, currentColor 50%, transparent 50%)", backgroundSize: "60px 100%", color: "#FFD166" }} />
      </motion.div>
    </>
  );
}

function CarTopDown({ color = "#1F4D7A", x, scale = 1, rotate = 0, label }: { color?: string; x: string | number; scale?: number; rotate?: number; label?: string }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: "50%", translateY: "-50%" }}
      animate={{ rotate }}
      transition={{ duration: 0.6 }}
    >
      <motion.svg width={70 * scale} height={36 * scale} viewBox="0 0 70 36">
        <rect x="6" y="2" width="58" height="32" rx="6" fill={color} />
        <rect x="14" y="6" width="42" height="10" rx="2" fill="rgba(255,255,255,0.3)" />
        <rect x="14" y="20" width="42" height="10" rx="2" fill="rgba(0,0,0,0.2)" />
        <circle cx="14" cy="6" r="2" fill="#FFE082" />
        <circle cx="56" cy="6" r="2" fill="#FFE082" />
      </motion.svg>
      {label && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-ink-700">{label}</div>
      )}
    </motion.div>
  );
}

// =========================================================================
// SCENES
// =========================================================================

function SignSpotlight({ sign, value }: { sign: SignKind; value?: number }) {
  return (
    <Stage>
      <motion.div
        className="absolute inset-0"
        animate={{ background: ["radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8), transparent 60%)", "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4), transparent 60%)"] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ translateX: "-50%", translateY: "-50%" }}
        initial={{ scale: 0.4, rotate: -10, opacity: 0 }}
        animate={{ scale: [0.4, 1.1, 1], rotate: [-10, 0, 0], opacity: [0, 1, 1] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sign kind={sign} size={170} speedValue={value} />
        </motion.div>
      </motion.div>
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <div className="inline-block h-1 w-24 rounded-full bg-ink-300" />
      </div>
    </Stage>
  );
}

function Speedometer({ target, unit }: { target: number; unit: string }) {
  const min = 0;
  const max = 90;
  const angle = (target - min) / (max - min) * 240 - 120;
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[80%] aspect-square">
          <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="speedRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#13A8A2" />
                <stop offset="100%" stopColor="#FFD166" />
              </linearGradient>
            </defs>
            <circle cx="0" cy="0" r="85" fill="white" stroke="#1F2937" strokeWidth="4" />
            <path d="M -73.6 42.5 A 85 85 0 1 1 73.6 42.5" fill="none" stroke="url(#speedRing)" strokeWidth="6" strokeLinecap="round" />
            {[0, 20, 40, 60, 80].map((v) => {
              const a = (v - min) / (max - min) * 240 - 120;
              const rad = (a - 90) * Math.PI / 180;
              const x1 = Math.cos(rad) * 70;
              const y1 = Math.sin(rad) * 70;
              const x2 = Math.cos(rad) * 60;
              const y2 = Math.sin(rad) * 60;
              const tx = Math.cos(rad) * 50;
              const ty = Math.sin(rad) * 50;
              return (
                <g key={v}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1F2937" strokeWidth="2" />
                  <text x={tx} y={ty + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1F2937">{v}</text>
                </g>
              );
            })}
            <motion.line
              x1="0" y1="6" x2="0" y2="-65"
              stroke="#E63946" strokeWidth="4" strokeLinecap="round"
              style={{ transformOrigin: "0 0" }}
              initial={{ rotate: -120 }}
              animate={{ rotate: angle }}
              transition={{ type: "spring", stiffness: 60, damping: 10, delay: 0.3 }}
            />
            <circle cx="0" cy="0" r="6" fill="#1F2937" />
          </svg>
          <div className="absolute inset-x-0 bottom-2 text-center">
            <motion.div
              className="text-3xl font-black text-ink-900"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              {target} <span className="text-sm font-bold text-ink-500">{unit}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

function FourWayStop({ labels }: { labels: Labels }) {
  return (
    <Stage>
      <div className="absolute inset-0 bg-emerald-50" />
      <div className="absolute left-1/2 top-0 h-full w-[28%] -translate-x-1/2 bg-ink-700" />
      <div className="absolute top-1/2 left-0 h-[28%] w-full -translate-y-1/2 bg-ink-700" />
      <motion.div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-sun-300" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
      <motion.div className="absolute top-1/2 left-0 h-[1px] w-full -translate-y-1/2 bg-sun-300" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
      {/* Stop signs at 4 corners */}
      {[
        { top: "8%", left: "62%" },
        { top: "62%", left: "62%" },
        { top: "62%", left: "30%" },
        { top: "8%", left: "30%" },
      ].map((p, i) => (
        <div key={i} className="absolute" style={p}>
          <Sign kind="stop" size={28} />
        </div>
      ))}
      {/* Car 1 (north, going south) — moves first */}
      <motion.div
        className="absolute"
        style={{ left: "47%", width: "6%" }}
        initial={{ top: "5%" }}
        animate={{ top: ["5%", "30%", "30%", "75%"] }}
        transition={{ duration: 4, times: [0, 0.25, 0.55, 1], repeat: Infinity, ease: "easeInOut" }}
      >
        <CarTopDown x={0} color="#1F4D7A" scale={0.7} rotate={90} label={labels.go} />
      </motion.div>
      {/* Car 2 (east, going west) — waits */}
      <motion.div
        className="absolute"
        style={{ top: "47%", width: "6%" }}
        initial={{ left: "92%" }}
        animate={{ left: ["92%", "70%", "70%", "70%"] }}
        transition={{ duration: 4, times: [0, 0.3, 0.7, 1], repeat: Infinity, ease: "easeInOut" }}
      >
        <CarTopDown x={0} color="#E63946" scale={0.7} rotate={180} label={labels.wait} />
      </motion.div>
    </Stage>
  );
}

function TIntersection({ labels }: { labels: Labels }) {
  return (
    <Stage>
      <div className="absolute inset-0 bg-emerald-50" />
      {/* Through road horizontal */}
      <div className="absolute top-[40%] left-0 right-0 h-[28%] bg-ink-700" />
      <motion.div className="absolute top-[54%] left-0 right-0 h-[1px] bg-sun-300" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
      {/* Side road vertical bottom */}
      <div className="absolute left-[42%] top-[68%] bottom-0 w-[16%] bg-ink-700" />
      {/* Through traffic */}
      <motion.div
        className="absolute"
        style={{ top: "47%" }}
        animate={{ left: ["-10%", "110%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <CarTopDown x={0} color="#1F4D7A" scale={0.7} label={labels.go} />
      </motion.div>
      {/* Side car waiting */}
      <motion.div
        className="absolute"
        style={{ left: "44%", width: "6%" }}
        initial={{ top: "78%" }}
        animate={{ top: ["78%", "78%", "78%", "55%"] }}
        transition={{ duration: 5, times: [0, 0.3, 0.65, 1], repeat: Infinity }}
      >
        <CarTopDown x={0} color="#E63946" scale={0.7} rotate={-90} label={labels.wait} />
      </motion.div>
    </Stage>
  );
}

function LeftTurnYield({ labels }: { labels: Labels }) {
  return (
    <Stage>
      <div className="absolute inset-0 bg-emerald-50" />
      <div className="absolute top-[35%] bottom-[35%] left-0 right-0 bg-ink-700" />
      <motion.div className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2 bg-sun-300" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }} />
      {/* Oncoming car (right → left) */}
      <motion.div
        className="absolute"
        style={{ top: "37%" }}
        animate={{ left: ["110%", "-15%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <CarTopDown x={0} color="#1F4D7A" scale={0.75} rotate={180} label={labels.go} />
      </motion.div>
      {/* You waiting to turn left */}
      <motion.div
        className="absolute"
        style={{ left: "30%" }}
        initial={{ top: "55%", rotate: 0 }}
        animate={{ top: ["55%", "55%", "30%"], rotate: [0, 0, -45] }}
        transition={{ duration: 5, times: [0, 0.7, 1], repeat: Infinity }}
      >
        <CarTopDown x={0} color="#E63946" scale={0.75} label={labels.wait} />
      </motion.div>
    </Stage>
  );
}

function PedCrosswalk({ labels }: { labels: Labels }) {
  return (
    <Stage>
      <Road y="55%" height="35%" />
      {/* Crosswalk stripes */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="absolute top-[55%] h-[35%] w-[3.5%] bg-white" style={{ left: `${50 + i * 5}%` }} />
      ))}
      {/* Stopped car waits before crosswalk */}
      <motion.div
        className="absolute"
        style={{ top: "65%" }}
        animate={{ left: ["-10%", "30%", "30%"] }}
        transition={{ duration: 4, times: [0, 0.3, 1], repeat: Infinity }}
      >
        <CarTopDown x={0} color="#1F4D7A" scale={0.8} label={labels.stop} />
      </motion.div>
      {/* Pedestrian walking across */}
      <motion.div
        className="absolute text-3xl"
        style={{ top: "50%" }}
        animate={{ left: ["55%", "78%"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, times: [0, 0.2, 0.8, 1], repeat: Infinity, repeatDelay: 0.2 }}
      >
        🚶
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink-800 ring-1 ring-ink-200"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {labels.pedestrian} → {labels.stop}
      </motion.div>
    </Stage>
  );
}

function BACScale({ value, labels }: { value: number; labels: Labels }) {
  const max = 0.10;
  const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
  const pct = Math.min(100, (safeValue / max) * 100);
  // Any non-zero BAC carries a legal consequence in Florida:
  // 0.02 = under-21 zero-tolerance suspension; 0.04 = CDL limit; 0.08 = adult DUI.
  const danger = safeValue >= 0.02;
  return (
    <Stage>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
        <motion.div
          className="text-5xl"
          animate={{ rotate: danger ? [0, -8, 8, -8, 0] : 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          🍺
        </motion.div>
        <div className="w-full max-w-md">
          <div className="mb-2 flex items-end justify-between text-xs font-bold text-ink-600">
            <span>0.00</span>
            <span>0.05</span>
            <span>0.08</span>
            <span>0.10</span>
          </div>
          <div className="relative h-7 w-full overflow-hidden rounded-full bg-emerald-100 ring-2 ring-ink-200">
            <motion.div
              className={`absolute inset-y-0 left-0 ${danger ? "bg-coral-500" : "bg-emerald-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-y-0"
              initial={{ left: 0 }}
              animate={{ left: `${pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <div className="-translate-x-1/2 -translate-y-1 rounded-md bg-ink-900 px-2 py-0.5 text-xs font-bold text-white">
                {safeValue.toFixed(2)}%
              </div>
            </motion.div>
          </div>
        </div>
        {danger && (
          <motion.div
            className="rounded-full bg-coral-100 px-4 py-1 text-sm font-bold text-coral-700"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ⚠ {labels.suspended}
          </motion.div>
        )}
      </div>
    </Stage>
  );
}

function Siren({ labels }: { labels: Labels }) {
  return (
    <Stage>
      <Road y="60%" height="35%" />
      {/* Your car pulls right */}
      <motion.div
        className="absolute"
        style={{ left: "30%" }}
        initial={{ top: "65%" }}
        animate={{ top: ["65%", "78%"] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeOut" }}
      >
        <CarTopDown x={0} color="#1F4D7A" scale={0.8} label={labels.you} />
      </motion.div>
      {/* Emergency vehicle approaching from behind with flashing lights */}
      <motion.div
        className="absolute"
        style={{ top: "65%" }}
        initial={{ left: "-15%" }}
        animate={{ left: ["-15%", "55%"] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5, ease: "linear" }}
      >
        <div className="relative">
          <CarTopDown x={0} color="#E63946" scale={0.85} label={labels.siren} />
          <motion.div
            className="absolute -left-1 -top-2 h-2 w-2 rounded-full"
            animate={{ backgroundColor: ["#E63946", "#1F4D7A", "#E63946"] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -right-1 -top-2 h-2 w-2 rounded-full"
            animate={{ backgroundColor: ["#1F4D7A", "#E63946", "#1F4D7A"] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </Stage>
  );
}

function SchoolBus({ labels }: { labels: Labels }) {
  return (
    <Stage>
      <Road y="55%" height="40%" />
      {/* Bus center */}
      <div className="absolute" style={{ top: "60%", left: "40%", width: "20%" }}>
        <div className="relative h-12 rounded-md bg-sun-400 ring-2 ring-ink-900">
          <div className="absolute inset-x-2 top-1 h-3 rounded-sm bg-sky-200" />
          <motion.div
            className="absolute -left-2 top-2 h-3 w-3 rounded-full bg-coral-500"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute -right-2 top-2 h-3 w-3 rounded-full bg-coral-500"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          {/* Stop arm */}
          <motion.div
            className="absolute left-1/2 top-3 h-6 w-6 -translate-x-1/2 origin-right"
            initial={{ rotate: 0 }}
            animate={{ rotate: [-90, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
          >
            <div className="h-full w-full rounded-sm bg-coral-500 ring-1 ring-ink-900 flex items-center justify-center text-[8px] font-black text-white">{labels.stop}</div>
          </motion.div>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-ink-800">{labels.schoolBus}</div>
        </div>
      </div>
      {/* Cars in both directions stopped */}
      <motion.div className="absolute" style={{ top: "55%", left: "10%" }} animate={{ x: [0, 0, 0] }}>
        <CarTopDown x={0} color="#1F4D7A" scale={0.7} label={labels.stop} />
      </motion.div>
      <motion.div className="absolute" style={{ top: "78%", right: "10%" }}>
        <CarTopDown x={0} color="#E63946" scale={0.7} rotate={180} label={labels.stop} />
      </motion.div>
    </Stage>
  );
}

function MoveOver({ labels }: { labels: Labels }) {
  return (
    <Stage>
      <Road y="45%" height="50%" />
      {/* Lane divider */}
      <motion.div className="absolute left-0 right-0 top-[70%] h-[2px]" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <div className="h-full w-full" style={{ backgroundImage: "linear-gradient(90deg, #FFD166 50%, transparent 50%)", backgroundSize: "30px 100%" }} />
      </motion.div>
      {/* Stopped emergency vehicle on right shoulder */}
      <div className="absolute" style={{ top: "82%", left: "60%" }}>
        <CarTopDown x={0} color="#E63946" scale={0.85} label={labels.stop} />
        <motion.div
          className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-12 rounded-full bg-coral-400"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
      </div>
      {/* You moving over to left lane */}
      <motion.div
        className="absolute"
        animate={{ left: ["10%", "55%"], top: ["75%", "55%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <CarTopDown x={0} color="#1F4D7A" scale={0.85} label={labels.moveOver} />
      </motion.div>
    </Stage>
  );
}

function Timeline({ highlight, lang }: { highlight: number; lang: Lang }) {
  const labels = TEXT[lang];
  const steps = [labels.tlsae, labels.permit, labels.months3, labels.months12];
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="relative h-2 rounded-full bg-ink-100">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gulf-400"
              initial={{ width: 0 }}
              animate={{ width: `${(highlight / steps.length) * 100}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1">
            {steps.map((label, i) => {
              const idx = i + 1;
              const reached = idx <= highlight;
              const active = idx === highlight;
              return (
                <motion.div
                  key={i}
                  className="text-center"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <motion.div
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ring-2 ${
                      active
                        ? "bg-sun-400 text-ink-900 ring-sun-500"
                        : reached
                        ? "bg-emerald-100 text-emerald-700 ring-emerald-300"
                        : "bg-white text-ink-400 ring-ink-200"
                    }`}
                    animate={active ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {idx}
                  </motion.div>
                  <div className={`mt-2 text-[10px] font-semibold leading-tight ${active ? "text-ink-900" : "text-ink-500"}`}>
                    {label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Stage>
  );
}

function GearItem({ which, labels }: { which: string; labels: Labels }) {
  const items = [
    { key: "helmet", emoji: "🪖", label: labels.helmet },
    { key: "eyes", emoji: "🥽", label: labels.eyes },
    { key: "body", emoji: "🧥", label: labels.body },
    { key: "visibility", emoji: "🦺", label: labels.visibility },
  ];
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-end gap-3 md:gap-6">
          {items.map((it) => {
            const active = it.key === which;
            return (
              <motion.div
                key={it.key}
                className="flex flex-col items-center"
                animate={active ? { y: [-2, -8, -2], scale: [1, 1.08, 1] } : { opacity: 0.4 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ring-2 md:h-20 md:w-20 ${
                    active ? "bg-sun-400 ring-sun-500" : "bg-white ring-ink-200"
                  }`}
                >
                  {it.emoji}
                </motion.div>
                {active && (
                  <div className="mt-2 max-w-[90px] text-center text-[10px] font-bold uppercase tracking-wide text-ink-800 md:max-w-[120px]">
                    {it.label}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
}

function BikeControl({ which, labels }: { which: string; labels: Labels }) {
  const map: Record<string, { label: string; sub: string; pos: { left: string; top: string } }> = {
    "right-hand": { label: labels.rightHand, sub: labels.throttle, pos: { left: "75%", top: "30%" } },
    "left-hand": { label: labels.leftHand, sub: labels.clutch, pos: { left: "25%", top: "30%" } },
    "right-foot": { label: labels.rightFoot, sub: labels.rearBrake, pos: { left: "70%", top: "75%" } },
    "left-foot": { label: labels.leftFoot, sub: labels.shifter, pos: { left: "30%", top: "75%" } },
  };
  const target = map[which] ?? map["right-hand"];
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-7xl md:text-8xl">🏍️</div>
      </div>
      <motion.div
        className="absolute"
        style={target.pos}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.8, ease: "backOut" }}
      >
        <motion.div
          className="h-10 w-10 rounded-full bg-sun-400/40 ring-4 ring-sun-400"
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
      <motion.div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl bg-white/95 px-4 py-2 text-center ring-1 ring-ink-200"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-[10px] font-black uppercase tracking-wider text-coral-600">{target.label}</div>
        <div className="text-sm font-bold text-ink-900">{target.sub}</div>
      </motion.div>
    </Stage>
  );
}

function CornerPhase({ step, labels }: { step: number; labels: Labels }) {
  const phaseLabels = [labels.slow, labels.look, labels.press, labels.roll];
  // Bike position along curve based on step (1: pre-curve, 2: entering, 3: apex, 4: exit)
  const positions = [
    { left: "15%", top: "70%", lean: 0 },
    { left: "30%", top: "55%", lean: -15 },
    { left: "50%", top: "40%", lean: -25 },
    { left: "75%", top: "55%", lean: -10 },
  ];
  const pos = positions[step - 1] ?? positions[0];
  return (
    <Stage>
      {/* Curving road */}
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <path d="M 0 55 Q 40 55 50 35 T 100 25" fill="none" stroke="#1F2937" strokeWidth="14" strokeLinecap="round" />
        <path d="M 0 55 Q 40 55 50 35 T 100 25" fill="none" stroke="#FFD166" strokeWidth="0.8" strokeDasharray="3 3" />
      </svg>
      <motion.div
        className="absolute text-4xl"
        style={pos}
        animate={{ rotate: pos.lean, scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        🏍️
      </motion.div>
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2">
        {phaseLabels.map((label, i) => {
          const active = i + 1 === step;
          return (
            <motion.div
              key={i}
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ${
                active ? "bg-sun-400 text-ink-900 ring-sun-500" : "bg-white/80 text-ink-400 ring-ink-200"
              }`}
              animate={active ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {label}
            </motion.div>
          );
        })}
      </div>
    </Stage>
  );
}

function MotorcycleLaw({ kind, labels }: { kind: string; labels: Labels }) {
  const map: Record<string, { emoji: string; label: string }> = {
    helmet: { emoji: "🪖", label: labels.helmetReq },
    lane: { emoji: "🚫", label: labels.laneSplit },
    headlight: { emoji: "💡", label: labels.headlightOn },
    brc: { emoji: "🎓", label: labels.brc },
  };
  const target = map[kind] ?? map.helmet;
  return (
    <Stage>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <motion.div
          className="text-7xl md:text-8xl"
          animate={{ rotate: kind === "lane" ? [0, -5, 5, -5, 0] : [0, 0], y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {target.emoji}
        </motion.div>
        <motion.div
          className="rounded-xl bg-white/95 px-4 py-2 text-center text-sm font-bold text-ink-900 ring-1 ring-ink-200"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {target.label}
        </motion.div>
      </div>
    </Stage>
  );
}

function WalkAround({ step, labels }: { step: number; labels: Labels }) {
  // Truck silhouette with 7 zones — highlight the active one
  const zones = [
    { left: "5%", top: "55%", label: "1" },
    { left: "20%", top: "30%", label: "2" },
    { left: "30%", top: "50%", label: "3" },
    { left: "50%", top: "20%", label: "4" },
    { left: "20%", top: "70%", label: "5" },
    { left: "70%", top: "50%", label: "6" },
    { left: "85%", top: "70%", label: "7" },
  ];
  return (
    <Stage>
      {/* Truck */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl md:text-7xl">🚛</div>
      {zones.map((z, i) => {
        const active = i + 1 === step;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: z.left, top: z.top }}
            animate={active ? { scale: [1, 1.3, 1], opacity: 1 } : { opacity: 0.35 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ring-2 ${
              active ? "bg-sun-400 text-ink-900 ring-sun-500" : "bg-white text-ink-500 ring-ink-200"
            }`}>
              {z.label}
            </div>
          </motion.div>
        );
      })}
      <motion.div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-3 py-1 text-xs font-bold text-white"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {labels.inspect} · {step} / 7
      </motion.div>
    </Stage>
  );
}

function AirSystem({ kind, labels }: { kind: string; labels: Labels }) {
  // Pressure gauge animation
  const targetPsi = kind === "warning" ? 50 : kind === "spring" ? 30 : 110;
  const angle = (targetPsi / 150) * 270 - 135;
  const danger = kind === "warning" || kind === "spring";
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[70%] aspect-square">
          <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full">
            <circle cx="0" cy="0" r="85" fill="white" stroke="#1F2937" strokeWidth="3" />
            {/* danger zone */}
            <path d="M -78.6 -32.5 A 85 85 0 0 1 -32.5 -78.6" fill="none" stroke="#E63946" strokeWidth="8" />
            {/* good zone */}
            <path d="M 0 -85 A 85 85 0 0 1 78.6 -32.5" fill="none" stroke="#10B981" strokeWidth="8" />
            {[0, 30, 60, 90, 120, 150].map((v) => {
              const a = (v / 150) * 270 - 135;
              const rad = (a - 90) * Math.PI / 180;
              const x = Math.cos(rad) * 65;
              const y = Math.sin(rad) * 65;
              return <text key={v} x={x} y={y + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#1F2937">{v}</text>;
            })}
            <motion.line
              x1="0" y1="6" x2="0" y2="-65"
              stroke="#1F2937" strokeWidth="3" strokeLinecap="round"
              style={{ transformOrigin: "0 0" }}
              initial={{ rotate: -135 }}
              animate={{ rotate: angle }}
              transition={{ type: "spring", stiffness: 50, damping: 12, delay: 0.3 }}
            />
            <circle cx="0" cy="0" r="6" fill="#1F2937" />
          </svg>
          <div className="absolute inset-x-0 bottom-2 text-center">
            <div className="text-2xl font-black text-ink-900">{targetPsi} <span className="text-xs font-bold text-ink-500">{labels.psi}</span></div>
          </div>
        </div>
      </div>
      {danger && (
        <motion.div
          className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral-500 px-3 py-1 text-xs font-black text-white"
          animate={{ opacity: [1, 0.4, 1], scale: [1, 1.05, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          ⚠ {kind === "spring" ? labels.spring : labels.warning}
        </motion.div>
      )}
      {kind === "fade" && (
        <motion.div
          className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral-500 px-3 py-1 text-xs font-black text-white"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          🔥 {labels.fade}
        </motion.div>
      )}
    </Stage>
  );
}

function CDLDisqual({ kind, labels }: { kind: string; labels: Labels }) {
  const text =
    kind === "second" ? labels.secondOffense :
    kind === "first" ? labels.firstOffense :
    kind === "serious" ? labels.serious :
    labels.firstOffense;
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* CDL card */}
          <motion.div
            className="relative h-32 w-52 rounded-xl bg-gradient-to-br from-gulf-500 to-gulf-700 p-3 text-white ring-2 ring-ink-900"
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-[10px] font-bold uppercase opacity-80">Florida CDL</div>
            <div className="mt-1 h-12 w-12 rounded bg-white/20" />
            <div className="absolute bottom-2 right-2 text-[10px] font-black opacity-60">A</div>
          </motion.div>
          {/* Stamp */}
          <motion.div
            className="absolute -right-4 -top-4 rotate-12 rounded-md border-4 border-coral-600 bg-coral-100 px-3 py-1 text-sm font-black uppercase text-coral-700"
            initial={{ scale: 3, opacity: 0, rotate: 45 }}
            animate={{ scale: [3, 1.1, 1], opacity: [0, 1, 1], rotate: [45, 12, 12] }}
            transition={{ duration: 1, ease: "backOut" }}
          >
            {kind === "second" ? labels.revoked : labels.suspended}
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-3 py-1 text-xs font-bold text-white">
        {text}
      </div>
    </Stage>
  );
}

function LicenseRevoke({ labels }: { labels: Labels }) {
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <motion.div
            className="h-32 w-52 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 text-white ring-2 ring-ink-900"
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-[10px] font-bold uppercase opacity-80">Florida License</div>
            <div className="mt-1 h-12 w-12 rounded bg-white/20" />
          </motion.div>
          <motion.div
            className="absolute -right-4 -top-4 rotate-12 rounded-md border-4 border-coral-600 bg-coral-100 px-3 py-1 text-sm font-black uppercase text-coral-700"
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: [3, 1.1, 1], opacity: [0, 1, 1] }}
            transition={{ duration: 1, ease: "backOut" }}
          >
            {labels.suspended}
          </motion.div>
        </div>
      </div>
    </Stage>
  );
}
