/**
 * Cliente mínimo para los endpoints públicos (no oficiales) de EA Clubs.
 * - Sin autenticación, pero el CDN (Akamai) bloquea clientes que no parecen navegador.
 * - clubs/matches devuelve como máximo los últimos 10 partidos por tipo: hay que
 *   consultar seguido y guardar todo en la base de datos.
 */
const BASE = "https://proclubs.ea.com/api/fc";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  Referer: "https://www.ea.com/",
  Origin: "https://www.ea.com",
};

export type EaMatchType = "leagueMatch" | "friendlyMatch" | "playoffMatch";

export interface EaMatchPlayer {
  playername: string;
  pos: string;
  rating: string;
  goals: string;
  assists: string;
  mom: string;
  secondsPlayed: string;
  [k: string]: unknown;
}

export interface EaMatchClub {
  goals: string;
  goalsAgainst: string;
  result: string;
  winnerByDnf: string;
  details?: { name?: string; clubId?: number };
  [k: string]: unknown;
}

export interface EaMatch {
  matchId: string;
  timestamp: number; // segundos Unix UTC
  clubs: Record<string, EaMatchClub>;
  players?: Record<string, Record<string, EaMatchPlayer>>;
}

export interface EaClubSearchResult {
  clubId: string;
  clubName: string;
  gamesPlayed?: string;
  currentDivision?: string;
  bestDivision?: string;
}

async function eaGet<T>(path: string, params: Record<string, string>, platform: string): Promise<T> {
  const qs = new URLSearchParams({ platform, ...params }).toString();
  const url = `${BASE}/${path}?${qs}`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000), cache: "no-store" });
      if (!res.ok) throw new Error(`EA ${res.status} en ${path}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export function searchClub(name: string, platform = "common-gen5") {
  return eaGet<EaClubSearchResult[]>("allTimeLeaderboard/search", { clubName: name }, platform);
}

export async function getMatches(clubId: string, matchType: EaMatchType, platform = "common-gen5") {
  const data = await eaGet<EaMatch[] | null>(
    "clubs/matches",
    { clubIds: clubId, matchType, maxResultCount: "10" },
    platform,
  );
  return data ?? [];
}

export function getMemberStats(clubId: string, platform = "common-gen5") {
  return eaGet<{ members: Array<Record<string, string>> }>("members/stats", { clubId }, platform);
}

/** Traduce el código de resultado de EA a algo legible. */
export function parseResult(matchType: EaMatchType, club: EaMatchClub): string {
  const gf = Number(club.goals), ga = Number(club.goalsAgainst);
  switch (club.result) {
    case "1": return "victoria";
    case "2": return "derrota";
    case "4": return "empate";
    case "16385": return "victoria_dnf"; // el rival abandonó
    case "10": return "derrota_dnf";     // abandonamos nosotros
  }
  // Amistosos: EA manda result "0"; se deduce por goles.
  return gf > ga ? "victoria" : gf < ga ? "derrota" : "empate";
}

/** Estadísticas globales del club: skillRating, bestDivision, récord (no trae la división actual). */
export function getOverallStats(clubId: string, platform = "common-gen5") {
  return eaGet<Array<Record<string, string>>>("clubs/overallStats", { clubIds: clubId }, platform);
}

export function getClubInfo(clubId: string, platform = "common-gen5") {
  return eaGet<Record<string, Record<string, unknown>>>("clubs/info", { clubIds: clubId }, platform);
}
