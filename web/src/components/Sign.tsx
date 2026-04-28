import type { SignKind } from "../types";

interface Props {
  kind: SignKind;
  size?: number;
  speedValue?: number;
  className?: string;
}

/**
 * Standalone, scalable, MUTCD-faithful SVG renderings of common Florida signs.
 * Drawn from primitives so they look crisp at any size and don't depend on external assets.
 */
export default function Sign({ kind, size = 120, speedValue, className }: Props) {
  const props = { width: size, height: size, viewBox: "0 0 120 120", className };
  switch (kind) {
    case "stop":
      return (
        <svg {...props}>
          <polygon points="36,4 84,4 116,36 116,84 84,116 36,116 4,84 4,36" fill="#c8202b" stroke="#fff" strokeWidth="6" />
          <text x="60" y="74" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="32" fill="#fff" letterSpacing="2">STOP</text>
        </svg>
      );
    case "yield":
      return (
        <svg {...props}>
          <polygon points="60,112 6,16 114,16" fill="#c8202b" stroke="#fff" strokeWidth="0" />
          <polygon points="60,100 18,24 102,24" fill="#fff" />
          <polygon points="60,94 24,28 96,28" fill="#c8202b" />
          <text x="60" y="64" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="20" fill="#fff">YIELD</text>
        </svg>
      );
    case "do-not-enter":
      return (
        <svg {...props}>
          <circle cx="60" cy="60" r="56" fill="#c8202b" stroke="#fff" strokeWidth="6" />
          <rect x="20" y="50" width="80" height="20" fill="#fff" rx="2" />
          <text x="60" y="98" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="11" fill="#fff">DO NOT ENTER</text>
        </svg>
      );
    case "wrong-way":
      return (
        <svg {...props}>
          <rect x="6" y="10" width="108" height="100" fill="#c8202b" stroke="#fff" strokeWidth="4" />
          <text x="60" y="55" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="22" fill="#fff">WRONG</text>
          <text x="60" y="84" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="22" fill="#fff">WAY</text>
        </svg>
      );
    case "one-way-left":
    case "one-way-right":
      return (
        <svg {...props}>
          <rect x="6" y="34" width="108" height="52" fill="#000" stroke="#fff" strokeWidth="3" />
          {kind === "one-way-left" ? (
            <polygon points="14,60 50,40 50,52 100,52 100,68 50,68 50,80" fill="#fff" />
          ) : (
            <polygon points="106,60 70,40 70,52 20,52 20,68 70,68 70,80" fill="#fff" />
          )}
          <text x="60" y="22" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="11" fill="#000">ONE WAY</text>
        </svg>
      );
    case "no-uturn":
    case "no-left-turn":
    case "no-right-turn":
      return (
        <svg {...props}>
          <rect x="6" y="6" width="108" height="108" fill="#fff" stroke="#000" strokeWidth="3" rx="6" />
          <circle cx="60" cy="58" r="42" fill="none" stroke="#c8202b" strokeWidth="8" />
          {kind === "no-uturn" && (
            <path d="M40,72 V52 a20 20 0 0 1 40 0 V72" fill="none" stroke="#000" strokeWidth="6" strokeLinecap="round" />
          )}
          {kind === "no-uturn" && (
            <polygon points="74,72 86,72 80,84" fill="#000" />
          )}
          {kind === "no-left-turn" && (
            <path d="M82,72 H50 V42" fill="none" stroke="#000" strokeWidth="6" />
          )}
          {kind === "no-left-turn" && <polygon points="42,42 58,42 50,28" fill="#000" />}
          {kind === "no-right-turn" && (
            <path d="M38,72 H70 V42" fill="none" stroke="#000" strokeWidth="6" />
          )}
          {kind === "no-right-turn" && <polygon points="62,42 78,42 70,28" fill="#000" />}
          <line x1="22" y1="22" x2="98" y2="94" stroke="#c8202b" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
    case "speed-limit":
      return (
        <svg {...props}>
          <rect x="14" y="6" width="92" height="108" fill="#fff" stroke="#000" strokeWidth="4" rx="3" />
          <text x="60" y="28" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="13" fill="#000">SPEED</text>
          <text x="60" y="44" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="13" fill="#000">LIMIT</text>
          <text x="60" y="92" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="44" fill="#000">{speedValue ?? "55"}</text>
        </svg>
      );
    case "school-zone":
    case "school-crossing":
      return (
        <svg {...props}>
          <polygon points="60,4 116,30 116,90 60,116 4,90 4,30" fill="#d6e94a" stroke="#000" strokeWidth="3" />
          <g transform="translate(36,32)">
            <circle cx="14" cy="10" r="6" fill="#000" />
            <path d="M6,28 H22 L26,40 H2 Z" fill="#000" />
            <circle cx="34" cy="14" r="5" fill="#000" />
            <path d="M28,30 H40 L44,44 H24 Z" fill="#000" />
          </g>
          <text x="60" y="92" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="10" fill="#000">SCHOOL</text>
        </svg>
      );
    case "pedestrian-crossing":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#d6e94a" stroke="#000" strokeWidth="3" />
          <circle cx="58" cy="38" r="6" fill="#000" />
          <path d="M48,52 L66,52 L72,72 L62,72 L66,90 L52,90 L48,70 L42,70 Z" fill="#000" />
        </svg>
      );
    case "railroad-crossing":
      return (
        <svg {...props}>
          <circle cx="60" cy="60" r="54" fill="#ffd400" stroke="#000" strokeWidth="4" />
          <line x1="10" y1="100" x2="110" y2="20" stroke="#000" strokeWidth="6" />
          <line x1="10" y1="20" x2="110" y2="100" stroke="#000" strokeWidth="6" />
          <text x="40" y="56" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="22" fill="#000">R</text>
          <text x="80" y="78" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="22" fill="#000">R</text>
        </svg>
      );
    case "railroad-crossbuck":
      return (
        <svg {...props}>
          <g transform="rotate(45 60 60)">
            <rect x="6" y="52" width="108" height="16" fill="#fff" stroke="#000" strokeWidth="3" />
          </g>
          <g transform="rotate(-45 60 60)">
            <rect x="6" y="52" width="108" height="16" fill="#fff" stroke="#000" strokeWidth="3" />
          </g>
          <text x="60" y="48" textAnchor="middle" fontSize="9" fill="#000" fontFamily="Arial Black">RAILROAD</text>
          <text x="60" y="80" textAnchor="middle" fontSize="9" fill="#000" fontFamily="Arial Black">CROSSING</text>
        </svg>
      );
    case "signal-ahead":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#ffd400" stroke="#000" strokeWidth="3" />
          <rect x="48" y="30" width="24" height="50" fill="#000" rx="3" />
          <circle cx="60" cy="40" r="6" fill="#c8202b" />
          <circle cx="60" cy="55" r="6" fill="#ffd400" />
          <circle cx="60" cy="70" r="6" fill="#43c071" />
        </svg>
      );
    case "stop-ahead":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#ffd400" stroke="#000" strokeWidth="3" />
          <polygon points="50,38 70,38 84,52 84,72 70,86 50,86 36,72 36,52" fill="#c8202b" stroke="#000" strokeWidth="2" />
          <text x="60" y="68" textAnchor="middle" fontFamily="Arial Black" fontSize="11" fill="#fff">STOP</text>
        </svg>
      );
    case "yield-ahead":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#ffd400" stroke="#000" strokeWidth="3" />
          <polygon points="60,84 36,42 84,42" fill="#c8202b" stroke="#000" strokeWidth="2" />
          <polygon points="60,76 44,46 76,46" fill="#fff" />
        </svg>
      );
    case "merge":
    case "lane-ends":
    case "two-way":
    case "no-passing":
    case "curve":
    case "winding-road":
    case "divided-highway":
    case "deer":
    case "slippery":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#ffd400" stroke="#000" strokeWidth="3" />
          {kind === "merge" && (
            <g stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round">
              <line x1="60" y1="100" x2="60" y2="50" />
              <path d="M60,50 Q60,32 80,28" />
            </g>
          )}
          {kind === "lane-ends" && (
            <g stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round">
              <line x1="50" y1="100" x2="50" y2="40" />
              <path d="M70,100 Q70,60 50,50" />
            </g>
          )}
          {kind === "two-way" && (
            <g stroke="#000" strokeWidth="5" fill="#000">
              <line x1="50" y1="100" x2="50" y2="30" />
              <polygon points="44,30 56,30 50,18" />
              <line x1="70" y1="20" x2="70" y2="90" />
              <polygon points="64,90 76,90 70,102" />
            </g>
          )}
          {kind === "no-passing" && (
            <g>
              <text x="60" y="40" textAnchor="middle" fontSize="11" fontFamily="Arial Black">NO</text>
              <text x="60" y="58" textAnchor="middle" fontSize="11" fontFamily="Arial Black">PASSING</text>
              <text x="60" y="76" textAnchor="middle" fontSize="11" fontFamily="Arial Black">ZONE</text>
            </g>
          )}
          {kind === "curve" && (
            <path d="M40,100 Q40,70 60,60 T80,30" stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round" />
          )}
          {kind === "winding-road" && (
            <path d="M40,100 Q40,80 50,70 Q60,60 50,50 Q40,40 60,30" stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round" />
          )}
          {kind === "divided-highway" && (
            <g stroke="#000" strokeWidth="5" fill="#000">
              <line x1="50" y1="98" x2="50" y2="60" />
              <line x1="70" y1="60" x2="70" y2="22" />
              <ellipse cx="60" cy="50" rx="6" ry="14" fill="#000" />
            </g>
          )}
          {kind === "deer" && (
            <g fill="#000">
              <path d="M44,82 L44,60 L52,52 L60,52 L66,46 L66,38 L62,32 L66,30 L72,38 L72,44 L80,52 L80,82 L74,82 L74,68 L52,68 L52,82 Z" />
            </g>
          )}
          {kind === "slippery" && (
            <g fill="#000">
              <rect x="38" y="56" width="44" height="14" rx="2" />
              <circle cx="46" cy="76" r="6" />
              <circle cx="74" cy="76" r="6" />
              <path d="M30,90 Q60,70 90,90" stroke="#000" strokeWidth="3" fill="none" />
            </g>
          )}
        </svg>
      );
    case "construction":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#ff7a2e" stroke="#000" strokeWidth="3" />
          <g fill="#000">
            <path d="M40,40 L52,40 L46,76 L34,76 Z" />
            <path d="M68,40 L80,40 L86,76 L74,76 Z" />
            <rect x="34" y="76" width="52" height="6" />
          </g>
        </svg>
      );
    case "flagger":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#ff7a2e" stroke="#000" strokeWidth="3" />
          <circle cx="60" cy="36" r="8" fill="#000" />
          <path d="M52,46 L68,46 L74,78 L46,78 Z" fill="#000" />
          <rect x="74" y="40" width="20" height="14" fill="#c8202b" stroke="#000" strokeWidth="2" />
        </svg>
      );
    case "detour":
      return (
        <svg {...props}>
          <rect x="6" y="34" width="108" height="52" fill="#ff7a2e" stroke="#000" strokeWidth="3" />
          <text x="40" y="68" textAnchor="middle" fontFamily="Arial Black" fontSize="14" fill="#000">DETOUR</text>
          <polygon points="80,52 100,60 80,68 80,62 70,62 70,58 80,58" fill="#000" />
        </svg>
      );
    case "hospital":
      return (
        <svg {...props}>
          <rect x="6" y="20" width="108" height="80" fill="#1d6cb8" stroke="#fff" strokeWidth="3" />
          <rect x="48" y="36" width="24" height="48" fill="#fff" />
          <rect x="36" y="48" width="48" height="24" fill="#fff" />
        </svg>
      );
    case "hov":
      return (
        <svg {...props}>
          <rect x="6" y="6" width="108" height="108" fill="#fff" stroke="#000" strokeWidth="3" />
          <text x="60" y="40" textAnchor="middle" fontSize="13" fontFamily="Arial Black">HOV</text>
          <text x="60" y="62" textAnchor="middle" fontSize="22" fontFamily="Arial Black">2+</text>
          <text x="60" y="84" textAnchor="middle" fontSize="9" fontFamily="Arial Black">ONLY</text>
        </svg>
      );
    case "interstate":
      return (
        <svg {...props}>
          <path d="M60,8 C100,8 112,28 112,52 V96 H8 V52 C8,28 20,8 60,8 Z" fill="#1f3a93" stroke="#fff" strokeWidth="4" />
          <path d="M8,32 H112" stroke="#c8202b" strokeWidth="14" />
          <text x="60" y="80" textAnchor="middle" fontSize="36" fontFamily="Arial Black" fill="#fff">95</text>
        </svg>
      );
    case "us-highway":
      return (
        <svg {...props}>
          <path d="M20,10 H100 L110,40 L60,110 L10,40 Z" fill="#fff" stroke="#000" strokeWidth="4" />
          <text x="60" y="48" textAnchor="middle" fontSize="14" fontFamily="Arial Black">US</text>
          <text x="60" y="82" textAnchor="middle" fontSize="32" fontFamily="Arial Black">1</text>
        </svg>
      );
    case "fl-state":
      return (
        <svg {...props}>
          <circle cx="60" cy="60" r="50" fill="#fff" stroke="#000" strokeWidth="4" />
          <text x="60" y="44" textAnchor="middle" fontSize="11" fontFamily="Arial Black">FLORIDA</text>
          <text x="60" y="84" textAnchor="middle" fontSize="32" fontFamily="Arial Black">A1A</text>
        </svg>
      );
    case "no-truck":
      return (
        <svg {...props}>
          <rect x="6" y="6" width="108" height="108" fill="#fff" stroke="#000" strokeWidth="3" rx="6" />
          <circle cx="60" cy="60" r="42" fill="none" stroke="#c8202b" strokeWidth="8" />
          <g fill="#000">
            <rect x="32" y="50" width="36" height="22" />
            <rect x="68" y="42" width="20" height="30" />
            <circle cx="42" cy="78" r="6" />
            <circle cx="76" cy="78" r="6" />
          </g>
          <line x1="22" y1="22" x2="98" y2="98" stroke="#c8202b" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
    case "weight-limit":
      return (
        <svg {...props}>
          <rect x="14" y="6" width="92" height="108" fill="#fff" stroke="#000" strokeWidth="4" rx="3" />
          <text x="60" y="32" textAnchor="middle" fontSize="11" fontFamily="Arial Black">WEIGHT</text>
          <text x="60" y="48" textAnchor="middle" fontSize="11" fontFamily="Arial Black">LIMIT</text>
          <text x="60" y="86" textAnchor="middle" fontSize="22" fontFamily="Arial Black">{speedValue ?? "10"}</text>
          <text x="60" y="104" textAnchor="middle" fontSize="11" fontFamily="Arial Black">TONS</text>
        </svg>
      );
    case "low-clearance":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#ffd400" stroke="#000" strokeWidth="3" />
          <text x="60" y="74" textAnchor="middle" fontSize="20" fontFamily="Arial Black">{speedValue ?? "12'-6\""}</text>
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <rect x="10" y="10" width="100" height="100" fill="#eee" stroke="#666" />
          <text x="60" y="64" textAnchor="middle" fontSize="11" fill="#666">{kind}</text>
        </svg>
      );
  }
}
