/**
 * Datos de la página pública del club: últimos partidos, balance y plantilla
 * (agregada desde match_players) + miembros del Discord vía la API de invitaciones.
 */
import { db } from "./supabase";
import { POS } from "./match-data";
import { PRIMARY_CLUB } from "./clubs";

export const DISCORD_INVITE = "https://discord.gg/Bc3BVhmJC2";
const INVITE_CODE = "Bc3BVhmJC2";

export interface RecentMatch {
  id: string;
  playedAt: string;
  type: string;
  result: string;
  goalsFor: number;
  goalsAgainst: number;
  opponent: string;
}

export interface SquadRow {
  id: string;
  name: string;
  pos: string;
  apps: number;
  goals: number;
  assists: number;
  mvps: number;
  rating: number;
}

export interface ClubPageData {
  recent: RecentMatch[];
  record: { played: number; w: number; d: number; l: number; gf: number; ga: number; since: string | null };
  squad: SquadRow[];
  discord: { members: number; online: number } | null;
  division: { current: number; skillRating: number | null } | null;
  failed: boolean;
}

const outcome = (r: string) => (r.startsWith("victoria") ? "w" : r.startsWith("derrota") ? "l" : "d");

async function discordCounts() {
  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${INVITE_CODE}?with_counts=true`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return { members: Number(j.approximate_member_count) || 0, online: Number(j.approximate_presence_count) || 0 };
  } catch {
    return null;
  }
}

export async function getClubPageData(): Promise<ClubPageData> {
  const discord = await discordCounts();
  const empty: ClubPageData = {
    recent: [],
    record: { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, since: null },
    squad: [],
    discord,
    division: null,
    failed: false,
  };

  try {
    const [{ data: matches, error: e1 }, { data: apps, error: e2 }, { data: status }] = await Promise.all([
      db()
        .from("matches")
        .select("match_id, played_at, match_type, goals_for, goals_against, result, opponent")
        .eq("club_id", PRIMARY_CLUB.id)
        .order("played_at", { ascending: false }),
      db()
        .from("match_players")
        .select("ea_player_id, gamertag, pos, seconds_played, rating, goals, assists, mom, matches!inner(club_id)")
        .eq("matches.club_id", PRIMARY_CLUB.id),
      db().from("club_status").select("current_division, skill_rating").eq("id", 1).maybeSingle(),
    ]);
    const division = status?.current_division ? { current: status.current_division, skillRating: status.skill_rating ?? null } : null;
    if (e1 || e2) throw e1 ?? e2;

    const all = matches ?? [];
    const record = { ...empty.record, played: all.length, since: all.at(-1)?.played_at ?? null };
    for (const m of all) {
      record[outcome(m.result ?? "")]++;
      record.gf += m.goals_for ?? 0;
      record.ga += m.goals_against ?? 0;
    }

    const recent = all.slice(0, 8).map((m) => ({
      id: m.match_id,
      playedAt: m.played_at,
      type: m.match_type,
      result: m.result ?? "",
      goalsFor: m.goals_for ?? 0,
      goalsAgainst: m.goals_against ?? 0,
      opponent: m.opponent ?? "Rival",
    }));

    // Plantilla: solo apariciones reales (> 0 s); posición = la más repetida
    const byPlayer = new Map<string, SquadRow & { ratingSum: number; posCount: Record<string, number> }>();
    for (const a of apps ?? []) {
      if (!a.seconds_played || a.seconds_played <= 0) continue;
      const id = String(a.ea_player_id);
      const p = byPlayer.get(id) ?? {
        id, name: a.gamertag ?? "Jugador", pos: "", apps: 0, goals: 0, assists: 0, mvps: 0, rating: 0,
        ratingSum: 0, posCount: {} as Record<string, number>,
      };
      p.name = a.gamertag ?? p.name;
      p.apps++;
      p.goals += a.goals ?? 0;
      p.assists += a.assists ?? 0;
      p.mvps += a.mom ? 1 : 0;
      p.ratingSum += Number(a.rating) || 0;
      const pos = String(a.pos ?? "").toLowerCase();
      p.posCount[pos] = (p.posCount[pos] ?? 0) + 1;
      byPlayer.set(id, p);
    }
    const squad = [...byPlayer.values()]
      .map(({ ratingSum, posCount, ...p }) => {
        const top = Object.entries(posCount).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "";
        return { ...p, pos: POS[top]?.label ?? "—", rating: p.apps ? ratingSum / p.apps : 0 };
      })
      .sort((x, y) => y.goals - x.goals || y.assists - x.assists || y.rating - x.rating);

    return { recent, record, squad, discord, division, failed: false };
  } catch (err) {
    console.error("club page:", err);
    return { ...empty, failed: true };
  }
}

/** EA numera 1 = Élite, 2 = División 1 … 6 = División 5 (verificado con sus escudos divisioncrest{n}.png). */
export const divisionLabel = (n: number) => (n <= 1 ? "Élite" : `División ${n - 1}`);
