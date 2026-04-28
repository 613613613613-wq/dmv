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
];
