/**
 * Prueba la API de EA desde tu máquina:
 *   npm run test:ea
 * - Busca el club por EA_CLUB_NAME y muestra su ID.
 * - Si hay EA_CLUB_ID, muestra los últimos partidos y quién jugó menos tiempo.
 */
import "dotenv/config";
import { searchClub, getMatches, parseResult, type EaMatchType } from "../lib/ea";

const platform = process.env.EA_PLATFORM || "common-gen5";
const name = process.env.EA_CLUB_NAME;
const clubId = process.env.EA_CLUB_ID;
const threshold = Number(process.env.LEAVER_THRESHOLD || 0.75);

if (name) {
  const clubs = await searchClub(name, platform);
  console.log(`\n🔎 Clubs que coinciden con "${name}":`);
  for (const c of clubs) console.log(`  ${c.clubId}  ${c.clubName}  (${c.gamesPlayed ?? "?"} partidos)`);
}

if (clubId) {
  for (const type of ["leagueMatch", "friendlyMatch"] as EaMatchType[]) {
    const matches = await getMatches(clubId, type, platform);
    console.log(`\n⚽ ${type}: ${matches.length} partidos`);
    for (const m of matches) {
      const club = m.clubs[clubId];
      const opp = Object.keys(m.clubs).find((k) => k !== clubId);
      const players = Object.values(m.players?.[clubId] ?? {});
      const max = Math.max(0, ...players.map((p) => Number(p.secondsPlayed)));
      const short = players
        .filter((p) => Number(p.secondsPlayed) > 0 && Number(p.secondsPlayed) < max * threshold)
        .map((p) => `${p.playername} (${Math.round((Number(p.secondsPlayed) / max) * 100)}%)`);
      console.log(
        `  ${new Date(m.timestamp * 1000).toLocaleString()}  ${club.goals}-${club.goalsAgainst} vs ${
          (opp && m.clubs[opp]?.details?.name) || "?"
        }  [${parseResult(type, club)}]  jugadores: ${players.length}` + (short.length ? `  ⚠️ ${short.join(", ")}` : ""),
      );
    }
  }
}
