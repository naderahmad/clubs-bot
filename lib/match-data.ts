/**
 * Convierte el JSON crudo de un partido de EA en datos listos para mostrar
 * (lo usan el embed de Discord y la imagen del partido).
 */
import { parseResult, type EaMatch, type EaMatchType } from "./ea";

export interface MatchPlayer {
  name: string;
  pos: string;
  posLabel: string;
  posOrder: number;
  rating: number;
  goals: number;
  assists: number;
  mom: boolean;
  seconds: number;
  minutes: number;
  shots: number;
  passes: number;
  passAttempts: number;
  tackles: number;
  tackleAttempts: number;
  saves: number;
  redcards: number;
}

export interface TeamStats {
  shots: number;
  passes: number;
  passAttempts: number;
  tackles: number;
  tackleAttempts: number;
  saves: number;
  reds: number;
}

export interface MatchView {
  matchId: string;
  type: EaMatchType;
  playedAt: Date;
  result: string;
  clubName: string;
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  players: MatchPlayer[]; // ordenados por posición y rating
  ranked: MatchPlayer[]; // ordenados por rendimiento
  mvp: MatchPlayer | null;
  mvpIsOfficial: boolean;
  us: TeamStats;
  them: TeamStats | null;
}

export const POS: Record<string, { label: string; order: number }> = {
  goalkeeper: { label: "POR", order: 0 },
  defender: { label: "DEF", order: 1 },
  midfielder: { label: "MED", order: 2 },
  forward: { label: "DEL", order: 3 },
};

export const TYPE_LABEL: Record<EaMatchType, string> = {
  leagueMatch: "Liga",
  friendlyMatch: "Amistoso",
  playoffMatch: "Playoff",
};

const n = (v: unknown) => Number(v ?? 0) || 0;

export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

type RawMatch = EaMatch & { aggregate?: Record<string, Record<string, unknown>> };

function teamStats(m: RawMatch, clubId: string): TeamStats {
  const agg = m.aggregate?.[clubId];
  const sum = (k: string) =>
    agg ? n(agg[k]) : Object.values(m.players?.[clubId] ?? {}).reduce((t, p) => t + n(p[k]), 0);
  return {
    shots: sum("shots"),
    passes: sum("passesmade"),
    passAttempts: sum("passattempts"),
    tackles: sum("tacklesmade"),
    tackleAttempts: sum("tackleattempts"),
    saves: sum("saves"),
    reds: sum("redcards"),
  };
}

const byPerformance = (a: MatchPlayer, b: MatchPlayer) =>
  b.rating - a.rating || b.goals - a.goals || b.assists - a.assists;

export function matchView(m: RawMatch, type: EaMatchType, clubId: string): MatchView {
  const club = m.clubs[clubId];
  const oppId = Object.keys(m.clubs).find((k) => k !== clubId);

  const players: MatchPlayer[] = Object.values(m.players?.[clubId] ?? {}).map((p) => {
    const pos = String(p.pos ?? "");
    const seconds = n(p.secondsPlayed);
    return {
      name: String(p.playername ?? "?"),
      pos,
      posLabel: POS[pos]?.label ?? "---",
      posOrder: POS[pos]?.order ?? 9,
      rating: n(p.rating),
      goals: n(p.goals),
      assists: n(p.assists),
      mom: p.mom === "1",
      seconds,
      minutes: Math.round(seconds / 60),
      shots: n(p.shots),
      passes: n(p.passesmade),
      passAttempts: n(p.passattempts),
      tackles: n(p.tacklesmade),
      tackleAttempts: n(p.tackleattempts),
      saves: n(p.saves),
      redcards: n(p.redcards),
    };
  });
  players.sort((a, b) => a.posOrder - b.posOrder || b.rating - a.rating);
  const ranked = [...players].sort(byPerformance);
  const official = players.find((p) => p.mom) ?? null;

  return {
    matchId: m.matchId,
    type,
    playedAt: new Date(m.timestamp * 1000),
    result: club ? parseResult(type, club) : "empate",
    clubName: club?.details?.name || "STARLINK FCX",
    opponent: (oppId && m.clubs[oppId]?.details?.name) || "Rival",
    goalsFor: n(club?.goals),
    goalsAgainst: n(club?.goalsAgainst),
    players,
    ranked,
    mvp: official ?? ranked[0] ?? null,
    mvpIsOfficial: !!official,
    us: teamStats(m, clubId),
    them: oppId ? teamStats(m, oppId) : null,
  };
}
