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
          {/* Walking-pedestrian silhouette (MUTCD W11-2 style): striding figure */}
          <g fill="#000">
            <circle cx="58" cy="34" r="6" />
            {/* torso + leading arm + back arm */}
            <path d="M48,46 L62,42 L70,52 L66,58 L60,52 L60,72 L54,72 Z" />
            {/* legs mid-stride */}
            <path d="M54,70 L62,72 L72,92 L66,94 L60,82 L52,96 L46,94 Z" />
          </g>
        </svg>
      );
    case "railroad-crossing":
      return (
        <svg {...props}>
          {/* MUTCD W10-1: yellow CIRCLE with bold black X and an R in the left
              and right sectors (the X meets at center, so Rs go into the side
              wedges, not the top/bottom ones). */}
          <circle cx="60" cy="60" r="54" fill="#ffd400" stroke="#000" strokeWidth="4" />
          <line x1="14" y1="106" x2="106" y2="14" stroke="#000" strokeWidth="9" strokeLinecap="square" />
          <line x1="14" y1="14" x2="106" y2="106" stroke="#000" strokeWidth="9" strokeLinecap="square" />
          <text x="22" y="70" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="#000">R</text>
          <text x="98" y="70" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="22" fontWeight="900" fill="#000">R</text>
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
    case "no-passing":
      return (
        <svg {...props}>
          {/* MUTCD W14-3: special pennant shape (horizontal triangle pointing right) */}
          <polygon points="6,18 114,60 6,102" fill="#ffd400" stroke="#000" strokeWidth="4" strokeLinejoin="miter" />
          <text x="44" y="50" textAnchor="middle" fontSize="11" fontFamily="Arial Black, sans-serif" fontWeight="900" fill="#000">NO</text>
          <text x="50" y="66" textAnchor="middle" fontSize="11" fontFamily="Arial Black, sans-serif" fontWeight="900" fill="#000">PASSING</text>
          <text x="56" y="82" textAnchor="middle" fontSize="11" fontFamily="Arial Black, sans-serif" fontWeight="900" fill="#000">ZONE</text>
        </svg>
      );
    case "merge":
    case "lane-ends":
    case "two-way":
    case "curve":
    case "winding-road":
    case "divided-highway":
    case "deer":
    case "slippery":
      return (
        <svg {...props}>
          <polygon points="60,8 112,60 60,112 8,60" fill="#ffd400" stroke="#000" strokeWidth="3" />
          {kind === "merge" && (
            /* MUTCD W4-1: vertical arrow with secondary line merging in from right */
            <g fill="#000" stroke="#000">
              {/* main vertical arrow shaft */}
              <line x1="58" y1="100" x2="58" y2="34" strokeWidth="7" strokeLinecap="round" />
              {/* arrowhead */}
              <polygon points="58,18 48,38 68,38" />
              {/* merging line curving in from upper-right and joining at the shaft */}
              <path d="M88,98 C88,72 76,58 60,52" fill="none" strokeWidth="7" strokeLinecap="round" />
            </g>
          )}
          {kind === "lane-ends" && (
            /* MUTCD W4-2: two parallel lanes, right one tapers into the left */
            <g>
              <g fill="none" stroke="#000" strokeWidth="6" strokeLinecap="round">
                {/* through (left) edge */}
                <line x1="48" y1="100" x2="48" y2="34" />
                {/* outer right edge tapering inward to meet the left edge */}
                <path d="M82,100 C82,70 80,52 52,40" />
              </g>
              {/* arrowhead at the top of the through lane */}
              <polygon points="48,18 36,38 60,38" fill="#000" />
            </g>
          )}
          {kind === "two-way" && (
            /* MUTCD W6-3: two arrows, one up, one down, side by side */
            <g fill="#000" stroke="#000" strokeLinecap="square">
              <line x1="46" y1="98" x2="46" y2="32" strokeWidth="6" />
              <polygon points="46,18 36,38 56,38" />
              <line x1="74" y1="22" x2="74" y2="88" strokeWidth="6" />
              <polygon points="74,102 64,82 84,82" />
            </g>
          )}
          {kind === "curve" && (
            /* MUTCD W1-2: curving arrow (left-curve variant shown) */
            <g fill="#000" stroke="#000" strokeLinecap="round" strokeLinejoin="round">
              <path d="M72,100 C72,76 56,58 46,46" fill="none" strokeWidth="8" />
              {/* clean arrowhead at top end pointing up-and-left along curve tangent */}
              <polygon points="32,32 56,38 46,52" />
            </g>
          )}
          {kind === "winding-road" && (
            /* MUTCD W1-5: S-curve arrow */
            <g fill="#000" stroke="#000" strokeLinecap="round" strokeLinejoin="round">
              <path d="M70,100 C70,82 40,72 40,58 C40,46 70,42 70,28" fill="none" strokeWidth="8" />
              {/* arrowhead at top */}
              <polygon points="70,16 58,32 82,32" />
            </g>
          )}
          {kind === "divided-highway" && (
            /* MUTCD W6-1: two parallel arrows around an oval median */
            <g fill="#000" stroke="#000" strokeLinecap="square">
              {/* left arrow shaft + head */}
              <line x1="40" y1="100" x2="40" y2="32" strokeWidth="6" />
              <polygon points="40,18 30,38 50,38" />
              {/* right arrow shaft + head */}
              <line x1="80" y1="100" x2="80" y2="32" strokeWidth="6" />
              <polygon points="80,18 70,38 90,38" />
              {/* center median */}
              <ellipse cx="60" cy="68" rx="6" ry="22" />
            </g>
          )}
          {kind === "deer" && (
            /* MUTCD W11-3: leaping-deer silhouette */
            <g fill="#000">
              {/* body */}
              <path d="M34,68 C34,60 42,56 56,56 L72,56 C82,56 88,60 88,66 L88,72 C88,74 86,76 84,76 L36,76 C34,76 32,74 32,72 Z" />
              {/* neck */}
              <path d="M76,58 L84,40 L92,40 L86,62 Z" />
              {/* head */}
              <ellipse cx="92" cy="38" rx="6" ry="4" />
              {/* ear */}
              <path d="M92,34 L96,28 L94,36 Z" />
              {/* antlers */}
              <path d="M88,34 L82,22 M84,30 L78,18 M92,32 L94,18 M96,30 L102,20" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* tail */}
              <path d="M32,62 L24,54 L30,64 Z" />
              {/* legs (front pair forward, back pair back) */}
              <path d="M38,76 L34,98 L40,98 L44,80 Z" />
              <path d="M48,76 L44,98 L50,98 L54,80 Z" />
              <path d="M72,76 L74,98 L80,98 L80,80 Z" />
              <path d="M82,76 L86,98 L92,98 L88,80 Z" />
            </g>
          )}
          {kind === "slippery" && (
            /* MUTCD W8-5: car silhouette with wavy skid marks below */
            <g fill="#000">
              {/* car: body + roof */}
              <path d="M28,68 L38,58 L52,52 L72,52 L84,58 L92,68 L92,76 L28,76 Z" />
              {/* wheel cutouts */}
              <circle cx="42" cy="76" r="6" fill="#ffd400" />
              <circle cx="78" cy="76" r="6" fill="#ffd400" />
              <circle cx="42" cy="76" r="4" />
              <circle cx="78" cy="76" r="4" />
              {/* wavy skid marks behind the rear wheel */}
              <path d="M16,90 Q24,86 32,90 T48,90 T64,90" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M22,100 Q30,96 38,100 T54,100 T70,100" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
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
