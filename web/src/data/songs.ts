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
];
