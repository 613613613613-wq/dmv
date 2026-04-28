export interface Song {
  id: string;
  audioFile: string;
  title: { en: string; es: string };
  topic: { en: string; es: string };
  description: { en: string; es: string };
  bullets: { en: string[]; es: string[] };
  emoji: string;
  vehicleClasses: ("car" | "motorcycle" | "cdl")[];
}

export const SONGS: Song[] = [
  {
    id: "eight-colors",
    audioFile: "/songs/eight-colors.mp3",
    title: { en: "Eight Colors", es: "Ocho Colores" },
    topic: { en: "Sign Colors", es: "Colores de Señales" },
    description: {
      en: "A catchy way to lock in what each road-sign color means before your test.",
      es: "Una forma pegadiza de memorizar qué significa cada color de señal antes del examen.",
    },
    bullets: {
      en: [
        "Red — stop, yield, do-not-do",
        "Yellow — general warning",
        "Orange — construction & work zones",
        "Yellow-green — school, pedestrian, bike",
        "Green — guide signs & directions",
        "Blue — motorist services (gas, food, lodging)",
        "Brown — parks, recreation, history",
        "White & Black — regulatory rules",
      ],
      es: [
        "Rojo — pare, ceda, prohibiciones",
        "Amarillo — advertencia general",
        "Naranja — construcción y zonas de trabajo",
        "Verde-amarillo — escuela, peatón, bicicleta",
        "Verde — señales de guía y direcciones",
        "Azul — servicios al motorista (gasolina, comida, hotel)",
        "Marrón — parques, recreación, historia",
        "Blanco y negro — reglas regulatorias",
      ],
    },
    emoji: "🎨",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "all-way-stop",
    audioFile: "/songs/all-way-stop.mp3",
    title: { en: "All-Way Stop", es: "Pare de Cuatro Vías" },
    topic: {
      en: "Right-of-way at 4-way stops",
      es: "Derecho de paso en intersecciones de 4 vías",
    },
    description: {
      en: "Who goes first at a four-way stop? This song hammers in the order so you'll never freeze at the line.",
      es: "¿Quién va primero en un alto de cuatro vías? Esta canción te graba el orden para que nunca dudes en la línea.",
    },
    bullets: {
      en: [
        "Everyone must come to a complete stop — count one-thousand-one.",
        "First to fully stop is first to go.",
        "If two arrive at the same time, the driver on the right goes first.",
        "If you're directly across from each other, both can go straight — but the one turning left yields.",
        "When in doubt, yield. A polite wave is faster than a crash.",
      ],
      es: [
        "Todos deben hacer un alto completo — cuenta mil-uno.",
        "El primero en parar por completo es el primero en avanzar.",
        "Si dos llegan al mismo tiempo, avanza primero el de la derecha.",
        "Si están de frente, ambos pueden seguir derecho — el que gira a la izquierda cede.",
        "Si dudas, cede el paso. Una seña cortés es más rápida que un choque.",
      ],
    },
    emoji: "🛑",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "yellow-diamond",
    audioFile: "/songs/yellow-diamond.mp3",
    title: { en: "Yellow Diamond", es: "Diamante Amarillo" },
    topic: {
      en: "Warning signs (yellow diamonds)",
      es: "Señales de advertencia (diamantes amarillos)",
    },
    description: {
      en: "Yellow diamond means \"caution — something's coming.\" This tune locks in the most-tested warning signs.",
      es: "El diamante amarillo significa \"precaución — algo viene\". Esta canción graba las advertencias más preguntadas.",
    },
    bullets: {
      en: [
        "Yellow + diamond = warning. Slow down and look ahead.",
        "Curve, winding road, and hill arrows tell you the road shape ahead.",
        "Pedestrian, school, deer, and bike signs warn you about who you might meet.",
        "Merge, lane-ends, and two-way arrows warn about other traffic patterns.",
        "Slippery, low-clearance, and railroad symbols warn about the surface or hazard.",
      ],
      es: [
        "Amarillo + diamante = advertencia. Reduce y mira adelante.",
        "Las flechas de curva, camino sinuoso y pendiente te dicen la forma del camino.",
        "Las señales de peatón, escuela, venado y bicicleta avisan a quién puedes encontrar.",
        "Las flechas de incorporación, fin de carril y dos sentidos avisan del tráfico.",
        "Los símbolos de resbaladizo, altura baja y vía férrea avisan del peligro o del piso.",
      ],
    },
    emoji: "🔶",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "speed-limit-beat",
    audioFile: "/songs/speed-limit-beat.mp3",
    title: { en: "Speed Limit Beat", es: "Ritmo del Límite" },
    topic: {
      en: "Florida default speed limits",
      es: "Límites de velocidad por defecto en Florida",
    },
    description: {
      en: "When no sign is posted, Florida still has default speed limits. This beat drills the numbers into your head.",
      es: "Cuando no hay señal, Florida igual tiene límites por defecto. Este ritmo te graba los números.",
    },
    bullets: {
      en: [
        "School zone — 20 mph.",
        "Business or residential district — 30 mph.",
        "Rural interstate — 70 mph (60 mph for trucks over 5 tons in some zones).",
        "Limited-access highway — 70 mph max.",
        "All other roads / state highways — 55 mph default.",
        "Always obey the posted sign — it overrides the default.",
      ],
      es: [
        "Zona escolar — 20 mph.",
        "Zona de negocios o residencial — 30 mph.",
        "Interestatal rural — 70 mph (60 mph para camiones de más de 5 toneladas en algunas zonas).",
        "Autopista de acceso limitado — máximo 70 mph.",
        "Otras vías / carreteras estatales — 55 mph por defecto.",
        "Siempre obedece la señal — manda sobre el límite por defecto.",
      ],
    },
    emoji: "🏁",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "four-seconds-back",
    audioFile: "/songs/four-seconds-back.mp3",
    title: { en: "Four Seconds Back", es: "Cuatro Segundos Atrás" },
    topic: {
      en: "Safe following distance",
      es: "Distancia de seguimiento segura",
    },
    description: {
      en: "Tailgating is the #1 cause of rear-end crashes. This song teaches the seconds-rule and when to add more.",
      es: "Pegarse al de adelante es la causa #1 de choques traseros. Esta canción enseña la regla de los segundos y cuándo añadir más.",
    },
    bullets: {
      en: [
        "Pick a fixed point. When the car ahead passes it, count: one-thousand-one, one-thousand-two…",
        "Two seconds is the bare minimum on a clear, dry road.",
        "Add a second for rain, fog, dusk, or a heavy load.",
        "Four-plus seconds when towing, on a motorcycle, or behind a big truck (you can't see around it).",
        "More space = more time to brake, swerve, or react to surprises.",
      ],
      es: [
        "Elige un punto fijo. Cuando el carro de adelante lo pase, cuenta: mil-uno, mil-dos…",
        "Dos segundos es el mínimo en vía seca y despejada.",
        "Añade un segundo si llueve, hay niebla, anochece o llevas carga pesada.",
        "Cuatro o más segundos al remolcar, en moto o detrás de un camión grande (no ves al frente).",
        "Más espacio = más tiempo para frenar, esquivar o reaccionar.",
      ],
    },
    emoji: "⏱️",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "move-over-slow-down",
    audioFile: "/songs/move-over-slow-down.mp3",
    title: { en: "Move Over, Slow Down", es: "Cambia de Carril, Reduce" },
    topic: { en: "Florida Move Over Law", es: "Ley de Cambio de Carril de Florida" },
    description: {
      en: "Florida's Move Over Law is one of the most-tested topics. This song nails who you must protect and how.",
      es: "La Ley de Cambio de Carril es uno de los temas más preguntados. Esta canción te enseña a quién proteger y cómo.",
    },
    bullets: {
      en: [
        "On a road with two or more lanes the same direction — move one lane away from a stopped emergency, utility, sanitation, tow, road-ranger, or wrecker vehicle with lights flashing.",
        "If you can't safely move over, slow down to 20 mph below the posted limit.",
        "If the posted limit is 20 mph or less, slow down to 5 mph.",
        "Same rule applies to disabled vehicles displaying hazard lights, emergency flares, or warning signs.",
        "Violating this law = points on your license plus a fine. Always move over when safe.",
      ],
      es: [
        "En vía de dos o más carriles del mismo sentido — cámbiate un carril lejos de vehículos de emergencia, servicios públicos, basura, grúas, o ranger detenidos con luces encendidas.",
        "Si no puedes cambiarte con seguridad, reduce a 20 mph por debajo del límite indicado.",
        "Si el límite es 20 mph o menos, reduce a 5 mph.",
        "La misma regla aplica a vehículos averiados con luces de emergencia, bengalas o señales de advertencia.",
        "Violar esta ley = puntos en tu licencia y multa. Siempre cámbiate cuando sea seguro.",
      ],
    },
    emoji: "🚨",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "school-bus-freeze",
    audioFile: "/songs/school-bus-freeze.mp3",
    title: { en: "School Bus Freeze", es: "Alto al Bus Escolar" },
    topic: { en: "Stopping for school buses", es: "Detenerse ante buses escolares" },
    description: {
      en: "When a school bus stops with red lights and stop arm, you stop too — unless the law's exception protects you. This song makes the rule unforgettable.",
      es: "Cuando un bus escolar para con luces rojas y brazo de pare, tú también paras — excepto en una situación. Esta canción hace la regla inolvidable.",
    },
    bullets: {
      en: [
        "On a 2-lane road — every direction must stop.",
        "On a multi-lane road with no median — every direction must stop.",
        "On a divided highway with a raised median or unpaved space of at least 5 feet — only traffic following the bus must stop.",
        "Painted lines or turn lanes do NOT count as a divider. Stop anyway.",
        "Stay stopped until the red lights stop flashing or the bus driver signals you to go.",
        "Penalty: minimum $200 fine; passing on the side kids exit can mean license suspension.",
      ],
      es: [
        "En vía de 2 carriles — todos los sentidos deben parar.",
        "En vía de varios carriles sin separador — todos los sentidos paran.",
        "En autopista dividida con separador elevado o espacio sin pavimentar de al menos 5 pies — solo paran los que siguen al bus.",
        "Líneas pintadas o carriles de giro NO cuentan como divisor. Igual debes parar.",
        "Sigue detenido hasta que las luces rojas se apaguen o el chofer te indique avanzar.",
        "Multa mínima de $200; pasar por el lado donde bajan los niños puede suspender tu licencia.",
      ],
    },
    emoji: "🚌",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "lines-on-the-road",
    audioFile: "/songs/lines-on-the-road.mp3",
    title: { en: "Lines on the Road", es: "Líneas en la Vía" },
    topic: { en: "Pavement markings", es: "Marcas del pavimento" },
    description: {
      en: "Yellow vs white, solid vs dashed — every line on the road tells you something. This song breaks down what each one means.",
      es: "Amarillo o blanco, sólido o discontinuo — cada línea te dice algo. Esta canción explica qué significa cada una.",
    },
    bullets: {
      en: [
        "Yellow lines separate traffic moving in opposite directions.",
        "White lines separate traffic moving in the same direction.",
        "Dashed = passing allowed when safe. Solid = passing not allowed on your side.",
        "Double solid yellow = no passing in either direction.",
        "A solid + dashed yellow = passing allowed only from the dashed side.",
        "Edge lines: white on the right, yellow on the left, mark the edge of the roadway.",
      ],
      es: [
        "Líneas amarillas separan tráfico en sentidos opuestos.",
        "Líneas blancas separan tráfico en el mismo sentido.",
        "Discontinua = puedes rebasar cuando sea seguro. Sólida = no puedes rebasar de tu lado.",
        "Doble amarilla sólida = nadie rebasa.",
        "Sólida + discontinua amarilla = solo rebasa el lado de la discontinua.",
        "Líneas de borde: blanca a la derecha, amarilla a la izquierda, marcan el borde de la vía.",
      ],
    },
    emoji: "🛣️",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "traffic-light",
    audioFile: "/songs/traffic-light.mp3",
    title: { en: "Traffic Light Permit", es: "Permiso del Semáforo" },
    topic: { en: "Traffic signals", es: "Semáforos" },
    description: {
      en: "Red, yellow, green — plus the arrows and the flashes. This song covers every signal Florida will quiz you on.",
      es: "Rojo, amarillo, verde — más las flechas y los destellos. Esta canción cubre todas las luces que te van a preguntar.",
    },
    bullets: {
      en: [
        "Solid red — full stop. Right turn on red allowed after stopping, unless a sign says NO TURN ON RED.",
        "Solid yellow — light is about to turn red. Stop if you can do so safely.",
        "Solid green — go if the intersection is clear; yield to pedestrians and oncoming traffic when turning.",
        "Green arrow — protected turn in the arrow's direction.",
        "Flashing red — treat like a stop sign.",
        "Flashing yellow — slow down and proceed with caution.",
        "Dark signal (no power) — treat the intersection as an all-way stop.",
      ],
      es: [
        "Rojo fijo — alto total. Vuelta a la derecha permitida tras parar, salvo si dice NO GIRAR EN ROJO.",
        "Amarillo fijo — la luz va a cambiar a rojo. Detente si puedes hacerlo con seguridad.",
        "Verde fijo — avanza si la intersección está libre; cede a peatones y al tráfico contrario al girar.",
        "Flecha verde — giro protegido en esa dirección.",
        "Rojo intermitente — trátalo como un PARE.",
        "Amarillo intermitente — reduce y avanza con precaución.",
        "Semáforo apagado (sin energía) — trátalo como alto de cuatro vías.",
      ],
    },
    emoji: "🚦",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "shape-parade",
    audioFile: "/songs/shape-parade.mp3",
    title: { en: "Shape Parade", es: "Desfile de Formas" },
    topic: { en: "Sign shapes", es: "Formas de las señales" },
    description: {
      en: "Even with the words covered up, the shape of a sign tells you what it means. This song parades them in order.",
      es: "Aunque tapen las palabras, la forma de la señal te dice lo que significa. Esta canción las desfila una por una.",
    },
    bullets: {
      en: [
        "Octagon (8 sides) — only used for STOP.",
        "Triangle pointing down — only used for YIELD.",
        "Diamond — warning of a hazard ahead.",
        "Pentagon (house shape) — school zone or school crossing.",
        "Pennant (horizontal triangle) — no-passing zone.",
        "Round — railroad crossing advance warning.",
        "Crossbuck (X) — at the actual railroad tracks.",
        "Rectangle vertical — regulatory rule. Horizontal — guidance or info.",
      ],
      es: [
        "Octágono (8 lados) — solo se usa para PARE.",
        "Triángulo apuntando hacia abajo — solo se usa para CEDA.",
        "Diamante — advertencia de un peligro adelante.",
        "Pentágono (forma de casa) — zona o cruce escolar.",
        "Banderín (triángulo horizontal) — zona donde no se rebasa.",
        "Redonda — aviso de cruce ferroviario.",
        "Crossbuck (X) — en las vías mismas.",
        "Rectángulo vertical — regla regulatoria. Horizontal — guía o información.",
      ],
    },
    emoji: "🔷",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
  {
    id: "fluorescent-green",
    audioFile: "/songs/fluorescent-green.mp3",
    title: { en: "Fluorescent Green", es: "Verde Fluorescente" },
    topic: {
      en: "Yellow-green signs (school, ped, bike)",
      es: "Señales verde-amarillo (escuela, peatón, bici)",
    },
    description: {
      en: "That bright fluorescent yellow-green color is reserved for the most vulnerable people on the road. This song teaches you when you'll see it.",
      es: "Ese color verde-amarillo fluorescente está reservado para los más vulnerables en la vía. Esta canción te enseña cuándo lo verás.",
    },
    bullets: {
      en: [
        "Fluorescent yellow-green = pedestrians, kids, or bicyclists nearby.",
        "School zone and school crossing signs use this color.",
        "Pedestrian crossing and bicycle crossing signs use this color.",
        "When you see it, slow down and scan both sides — small people are hard to see.",
        "Fines and points double in school zones during posted hours.",
      ],
      es: [
        "Verde-amarillo fluorescente = peatones, niños o ciclistas cerca.",
        "Las señales de zona y cruce escolar usan este color.",
        "Las señales de cruce de peatones y de bicicletas usan este color.",
        "Cuando lo veas, reduce y mira a ambos lados — las personas pequeñas son difíciles de ver.",
        "Las multas y puntos se duplican en zonas escolares en horarios indicados.",
      ],
    },
    emoji: "💚",
    vehicleClasses: ["car", "motorcycle", "cdl"],
  },
];
