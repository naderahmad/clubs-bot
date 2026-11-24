/**
 * Clubes que sigue el bot. Los mismos jugadores juegan en los dos, así que comparten
 * convocatorias, tarjetas y canal; cambia el escudo y los colores de la imagen del partido.
 * Ojo: los IDs de club de EA cambian con cada juego anual.
 */
import type { CardTheme } from "./match-card";

export interface Club {
  id: string;
  name: string;
  /** Escudo cuadrado (imagen del partido) y el que sale como icono del embed, rutas dentro de /public. */
  crest: string;
  embedIcon: string;
  theme: CardTheme;
  /** El principal guarda Skill Rating/división para la web. */
  primary?: boolean;
}

const STARLINK_THEME: CardTheme = {
  bg: "linear-gradient(180deg, #0b1d4a 0%, #071434 45%, #040b20 100%)",
  header: "#01040d",
  card: "linear-gradient(165deg, #2c5cc4 0%, #173679 42%, #0d1f4a 78%, #0a1838 100%)",
  cardBorder: "#4f82f5",
  accent: "#3d7bff",
  muted: "#a9bde6",
  mutedRgb: "169,189,230",
  lineRgb: "120,165,255",
  shade: "8,16,40",
  opponentInk: "#d5dff5",
};

const TITANS_THEME: CardTheme = {
  bg: "linear-gradient(180deg, #3a0b0b 0%, #1c0606 45%, #0b0303 100%)",
  header: "#070303",
  card: "linear-gradient(165deg, #b3261e 0%, #6e1410 42%, #3d0a08 78%, #260605 100%)",
  cardBorder: "#e0a33a",
  accent: "#f0b429",
  muted: "#e8bfae",
  mutedRgb: "232,191,174",
  lineRgb: "240,180,41",
  shade: "30,6,5",
  opponentInk: "#f5dcd2",
};

export const CLUBS: Club[] = [
  { id: "621507", name: "STARLINK FCX", crest: "/escudo-cuadrado.png", embedIcon: "/escudo.jpg", theme: STARLINK_THEME, primary: true },
  { id: "968764", name: "TITANS CR1OLLO", crest: "/clubs/titans-cuadrado.png", embedIcon: "/clubs/titans-cuadrado.png", theme: TITANS_THEME },
];

export const PRIMARY_CLUB = CLUBS.find((c) => c.primary)!;
export const clubById = (id: string | null | undefined) => CLUBS.find((c) => c.id === id) ?? PRIMARY_CLUB;
