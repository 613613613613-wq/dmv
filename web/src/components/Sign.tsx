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
          {/* MUTCD R5-1: red rounded square with a wide white "no entry" bar
              in the upper portion and DO NOT ENTER in white below the bar. */}
          <rect x="4" y="4" width="112" height="112" rx="14" fill="#c8202b" stroke="#fff" strokeWidth="4" />
          <rect x="16" y="38" width="88" height="22" fill="#fff" rx="2" />
          <text x="60" y="84" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="14" fill="#fff">DO NOT</text>
          <text x="60" y="102" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="14" fill="#fff">ENTER</text>
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
          {/* MUTCD R6-1: black horizontal sign with ONE WAY text in white at top
              and a clean white arrow across the middle. */}
          <rect x="6" y="22" width="108" height="76" fill="#000" stroke="#fff" strokeWidth="3" />
          <text x="60" y="42" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="13" fill="#fff" letterSpacing="1">ONE WAY</text>
          {kind === "one-way-left" ? (
            <g fill="#fff">
              <rect x="32" y="68" width="68" height="10" />
              <polygon points="14,73 36,60 36,86" />
            </g>
          ) : (
            <g fill="#fff">
              <rect x="20" y="68" width="68" height="10" />
              <polygon points="106,73 84,60 84,86" />
            </g>
          )}
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
          {/* MUTCD S1-1: yellow-green pentagon with two walking children
              silhouettes (a smaller child in front of a taller one). */}
          <polygon points="60,4 116,30 116,90 60,116 4,90 4,30" fill="#d6e94a" stroke="#000" strokeWidth="3" />
          <g fill="#000">
            {/* smaller child (front, leading) */}
            <circle cx="42" cy="44" r="6" />
            <path d="M34,52 L48,52 L52,76 L46,78 L42,68 L42,78 L36,76 Z" />
            <path d="M36,76 L32,98 L38,98 L42,80 Z" />
            <path d="M44,80 L48,98 L54,98 L50,76 Z" />
            {/* taller child / adult (back) */}
            <circle cx="74" cy="36" r="7" />
            <path d="M64,46 L82,46 L86,78 L78,80 L74,68 L74,80 L66,78 Z" />
            <path d="M66,78 L62,102 L70,102 L72,82 Z" />
            <path d="M76,82 L80,102 L88,102 L84,78 Z" />
          </g>
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
          {/* MUTCD R15-1: two crossed white slats with RAILROAD on one and
              CROSSING on the other, each rotated to follow its slat. */}
          <g transform="rotate(45 60 60)">
            <rect x="2" y="52" width="116" height="16" fill="#fff" stroke="#000" strokeWidth="3" />
            <text x="60" y="64" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial Black, sans-serif" fill="#000" letterSpacing="0.5">RAILROAD</text>
          </g>
          <g transform="rotate(-45 60 60)">
            <rect x="2" y="52" width="116" height="16" fill="#fff" stroke="#000" strokeWidth="3" />
            <text x="60" y="64" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial Black, sans-serif" fill="#000" letterSpacing="0.5">CROSSING</text>
          </g>
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
              {/* branched antlers (one on each side, with tines) */}
              <path
                d="M88,36 L82,22 M82,22 L76,24 M82,22 L80,16
                   M94,34 L98,20 M98,20 L104,22 M98,20 L100,14"
                stroke="#000"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* ear */}
              <path d="M90,32 L94,26 L94,34 Z" />
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
          {/* MUTCD W21-1: orange diamond, worker silhouette with hardhat
              digging with a shovel into a small mound. */}
          <polygon points="60,8 112,60 60,112 8,60" fill="#ff7a2e" stroke="#000" strokeWidth="3" />
          <g fill="#000">
            {/* hardhat dome */}
            <path d="M38,32 Q56,18 70,32 L70,36 L38,36 Z" />
            {/* head */}
            <circle cx="54" cy="42" r="4" />
            {/* torso (slightly bent forward) */}
            <path d="M44,46 L64,46 L68,72 L60,74 L52,72 L46,68 Z" />
            {/* legs */}
            <path d="M48,72 L46,96 L54,96 L56,76 Z" />
            <path d="M58,74 L62,96 L68,96 L66,72 Z" />
            {/* arm + shovel handle */}
            <path d="M64,52 L92,76" stroke="#000" strokeWidth="5" strokeLinecap="round" />
            {/* shovel blade */}
            <path d="M86,72 L100,80 L94,90 L80,82 Z" />
            {/* dirt mound */}
            <path d="M70,98 Q86,90 100,98 L100,102 L70,102 Z" />
          </g>
        </svg>
      );
    case "flagger":
      return (
        <svg {...props}>
          {/* MUTCD W11-7: orange diamond, worker with hardhat holding a red flag. */}
          <polygon points="60,8 112,60 60,112 8,60" fill="#ff7a2e" stroke="#000" strokeWidth="3" />
          <g fill="#000">
            {/* hardhat */}
            <path d="M44,30 Q60,20 76,30 L76,34 L44,34 Z" />
            {/* head */}
            <circle cx="60" cy="40" r="5" />
            {/* torso */}
            <path d="M48,46 L72,46 L76,80 L44,80 Z" />
            {/* legs */}
            <rect x="48" y="80" width="9" height="22" />
            <rect x="63" y="80" width="9" height="22" />
            {/* extended arm to flag */}
            <line x1="74" y1="52" x2="96" y2="44" stroke="#000" strokeWidth="5" strokeLinecap="round" />
            {/* flag pole */}
            <line x1="96" y1="36" x2="96" y2="74" stroke="#000" strokeWidth="2.5" />
          </g>
          {/* red flag */}
          <rect x="76" y="38" width="20" height="14" fill="#c8202b" stroke="#000" strokeWidth="1.5" />
        </svg>
      );
    case "detour":
      return (
        <svg {...props}>
          {/* MUTCD M4-9: orange rectangle, "DETOUR" text + clean horizontal arrow. */}
          <rect x="6" y="22" width="108" height="76" fill="#ff7a2e" stroke="#000" strokeWidth="3" />
          <text x="60" y="50" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="16" fill="#000" letterSpacing="1">DETOUR</text>
          <g fill="#000">
            <rect x="22" y="74" width="62" height="8" />
            <polygon points="100,78 80,66 80,90" />
          </g>
        </svg>
      );
    case "hospital":
      return (
        <svg {...props}>
          {/* MUTCD D9-2: blue square with bold white H. */}
          <rect x="6" y="6" width="108" height="108" fill="#1d6cb8" stroke="#fff" strokeWidth="3" rx="3" />
          <g fill="#fff">
            <rect x="30" y="26" width="16" height="68" />
            <rect x="74" y="26" width="16" height="68" />
            <rect x="30" y="52" width="60" height="16" />
          </g>
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
          {/* MUTCD R5-2: white square, red prohibition circle, semi truck
              silhouette inside (trailer + cab + wheels), red diagonal slash. */}
          <rect x="6" y="6" width="108" height="108" fill="#fff" stroke="#000" strokeWidth="3" rx="6" />
          <circle cx="60" cy="60" r="42" fill="none" stroke="#c8202b" strokeWidth="8" />
          <g fill="#000">
            {/* trailer box */}
            <rect x="24" y="46" width="46" height="24" />
            {/* cab in front */}
            <rect x="70" y="38" width="20" height="32" />
            {/* hood/bumper bump */}
            <rect x="86" y="58" width="8" height="12" />
            {/* chassis */}
            <rect x="22" y="70" width="74" height="3" />
            {/* wheels */}
            <circle cx="36" cy="78" r="6" />
            <circle cx="80" cy="78" r="6" />
          </g>
          {/* hub highlights so wheels read as wheels */}
          <circle cx="36" cy="78" r="2" fill="#fff" />
          <circle cx="80" cy="78" r="2" fill="#fff" />
          <line x1="24" y1="24" x2="96" y2="96" stroke="#c8202b" strokeWidth="8" strokeLinecap="round" />
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
