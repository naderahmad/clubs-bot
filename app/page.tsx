import { getClubPageData, DISCORD_INVITE, type RecentMatch } from "@/lib/club-page";
import { TYPE_LABEL } from "@/lib/match-data";
import type { EaMatchType } from "@/lib/ea";
import { CopyName } from "./copy-name";
import { Proximity } from "./proximity";

export const revalidate = 120;

const CLUB = "STARLINK FCX";
const STREAM_URL = process.env.STREAM_URL || "";

const dateFmt = new Intl.DateTimeFormat("es-VE", {
  timeZone: "America/Caracas",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
/** "22 nov · 10:38 p. m." */
function fmtDate(d: Date) {
  const parts = dateFmt.formatToParts(d);
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  const ampm = get("dayPeriod");
  return `${get("day")} ${get("month").replace(".", "")} · ${get("hour")}:${get("minute")}${ampm ? " " + ampm : ""}`;
}
const fmtDay = new Intl.DateTimeFormat("es-VE", { timeZone: "America/Caracas", day: "numeric", month: "long" });

const RESULT: Record<string, { mark: string; tone: string; note?: string }> = {
  victoria: { mark: "V", tone: "w" },
  victoria_dnf: { mark: "V", tone: "w", note: "el rival abandonó" },
  empate: { mark: "E", tone: "d" },
  derrota: { mark: "D", tone: "l" },
  derrota_dnf: { mark: "D", tone: "l", note: "abandonamos" },
};

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1.1a15.7 15.7 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17 17 0 0 0 5.2 2.6l1.1-1.8c-.6-.2-1.2-.5-1.7-.9l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7ZM8.5 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm7 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z"
      />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M12 2.5l2.2 7.3H22l-6.2 4.6 2.4 7.3L12 17.2l-6.2 4.5 2.4-7.3L2 9.8h7.8z" />
    </svg>
  );
}

function MatchRow({ m }: { m: RecentMatch }) {
  const r = RESULT[m.result] ?? { mark: "–", tone: "d" };
  return (
    <li className={`lum match tone-${r.tone}`}>
      <span className="mark" aria-label={r.mark === "V" ? "Victoria" : r.mark === "D" ? "Derrota" : "Empate"}>
        {r.mark}
      </span>
      <span className="score">
        {m.goalsFor}<span className="dash">–</span>{m.goalsAgainst}
      </span>
      <span className="who">
        <span className="opp">vs {m.opponent}</span>
        <span className="meta">
          {TYPE_LABEL[m.type as EaMatchType] ?? m.type} · {fmtDate(new Date(m.playedAt))}
          {r.note ? ` · ${r.note}` : ""}
        </span>
      </span>
    </li>
  );
}

export default async function Home() {
  const { recent, record, squad, discord, failed } = await getClubPageData();
  const topScorer = squad[0]?.goals ? squad[0].id : null;

  return (
    <main>
      <Proximity />

      <section className="hero" aria-labelledby="club">
        <img className="crest" src="/escudo.jpg" alt="Escudo de STARLINK FCX" width={600} height={800} />
        <h1 id="club">{CLUB}</h1>
        <CopyName name={CLUB} />
        <ul className="chips" aria-label="Datos del club">
          <li>EA FC 27 · Clubs</li>
          <li>PS5</li>
          <li>Crossplay</li>
        </ul>
        <div className="door">
          <a className="discord" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            <DiscordMark />
            Entrar al Discord
          </a>
          {discord && (
            <p className="presence">
              <span className="dot" aria-hidden="true" />
              {discord.online} en línea · {discord.members} miembros
            </p>
          )}
        </div>
      </section>

      <section className="route" aria-labelledby="unirte">
        <h2 id="unirte">Cómo unirte</h2>
        <ol>
          <li className="lum step">
            <h3>Copia el nombre</h3>
            <p><strong>{CLUB}</strong>, tal cual: en mayúsculas y con espacio.</p>
          </li>
          <li className="lum step">
            <h3>Búscalo en el juego</h3>
            <p>EA FC 27 → Clubs → Buscar club. Jugamos en PS5 con crossplay activado.</p>
          </li>
          <li className="lum step">
            <h3>Preséntate en el Discord</h3>
            <p>
              Ahí se arman las convocatorias y el bot publica el resumen de cada partido.{" "}
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">Abrir invitación</a>
            </p>
          </li>
        </ol>
        {STREAM_URL && (
          <a className="stream" href={STREAM_URL} target="_blank" rel="noopener noreferrer">
            Ver el stream del club
          </a>
        )}
      </section>

      <section className="results" aria-labelledby="partidos">
        <h2 id="partidos">Últimos partidos</h2>
        {record.played > 0 && (
          <p className="record">
            <span className="tone-w">{record.w} V</span> · <span>{record.d} E</span> ·{" "}
            <span className="tone-l">{record.l} D</span> en {record.played} partidos · {record.gf} goles a favor, {record.ga} en contra
            {record.since ? ` desde el ${fmtDay.format(new Date(record.since))}` : ""}
          </p>
        )}
        {recent.length ? (
          <ol className="matches">{recent.map((m) => <MatchRow key={m.id} m={m} />)}</ol>
        ) : (
          <p className="empty">
            {failed ? "No pudimos cargar los partidos ahora mismo. Vuelve a intentarlo en un rato." : "Todavía no hay partidos guardados."}
          </p>
        )}
      </section>

      <section className="squad" aria-labelledby="plantilla">
        <h2 id="plantilla">Plantilla</h2>
        <p className="record">
          Goles, asistencias y nota en partidos reales{record.since ? ` desde el ${fmtDay.format(new Date(record.since))}` : ""}.
        </p>
        {squad.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col" className="name">Jugador</th>
                  <th scope="col" title="Partidos jugados">PJ</th>
                  <th scope="col" title="Goles">G</th>
                  <th scope="col" title="Asistencias">A</th>
                  <th scope="col" title="Veces MVP">MVP</th>
                  <th scope="col" title="Nota media">Nota</th>
                </tr>
              </thead>
              <tbody>
                {squad.map((p) => (
                  <tr key={p.id} className={`lum${p.id === topScorer ? " top" : ""}`}>
                    <th scope="row" className="name">
                      <span className="player">
                        <span className="pos">{p.pos}</span>
                        <span className="tag">{p.name}</span>
                        {p.id === topScorer && <span className="crown">Goleador</span>}
                      </span>
                    </th>
                    <td>{p.apps}</td>
                    <td className="strong">{p.goals}</td>
                    <td>{p.assists}</td>
                    <td>{p.mvps ? <span className="mvp"><Star />{p.mvps}</span> : "–"}</td>
                    <td>{p.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">{failed ? "No pudimos cargar la plantilla ahora mismo." : "Aún no hay apariciones guardadas."}</p>
        )}
      </section>

      <footer>
        <img src="/escudo-cuadrado.png" alt="" width={48} height={48} />
        <div>
          <p className="foot-name">{CLUB}</p>
          <p>EA FC 27 Clubs · PS5 crossplay · ID 621507. Resultados de partidos reales, se actualizan cada 2 minutos.</p>
        </div>
        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">Discord</a>
      </footer>
    </main>
  );
}
