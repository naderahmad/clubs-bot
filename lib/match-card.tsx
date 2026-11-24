/**
 * Lámina horizontal del partido (se renderiza a PNG con next/og):
 * cabecera con escudos y marcador, una carta por jugador y comparativa de equipos.
 * Se ve en Discord a ~1/3 de su tamaño: los textos pequeños no bajan de ~18px.
 * Ojo: satori solo entiende flexbox; todo div con varios hijos necesita display:flex.
 */
import type { CSSProperties } from "react";
import { pct, playerStatus, TYPE_LABEL, type MatchPlayer, type MatchView, type PlayerStatus } from "./match-data";
import type { Insight } from "./match-insights";

export const CARD_WIDTH = 1600;
const PAD = 48;
const HEADER_H = 250;
const INSIGHTS_H = 150; // franja "Claves del partido" (con margen superior)
const GOOD = "#2ecc71";

/** Datos que no vienen de EA: avatares de Discord y rojas del bot por abandono. */
export interface CardExtras {
  avatars: Record<string, string>; // eaPlayerId -> URL o data URL
  abandonos: string[]; // eaPlayerId
  opponentCrest: string | null; // data URL del escudo del rival en el juego
}

/** Colores que cambian por club (ver lib/clubs.ts). */
export interface CardTheme {
  bg: string; // fondo de la lámina
  header: string; // banda de la cabecera (mismo tono que el fondo del escudo)
  card: string; // carta normal
  cardBorder: string;
  accent: string; // barras de la comparativa
  muted: string; // texto secundario
  mutedRgb: string; // "r,g,b" del secundario, para transparencias
  lineRgb: string; // "r,g,b" de separadores y aro del avatar
  shade: string; // "r,g,b" oscuro de la franja de estado
  opponentInk: string;
}

const INK = "#f4f7ff";
const GOLD_INK = "#2a1b00";
const RED = "#ff4d4f";
const AMBER = "#ffb547";

const RESULT: Record<string, { label: string; color: string }> = {
  victoria: { label: "VICTORIA", color: "#2ecc71" },
  victoria_dnf: { label: "VICTORIA · EL RIVAL ABANDONÓ", color: "#2ecc71" },
  derrota: { label: "DERROTA", color: "#ff5a52" },
  derrota_dnf: { label: "DERROTA · ABANDONAMOS", color: "#ff5a52" },
  empate: { label: "EMPATE", color: "#b8c4d6" },
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function localDate(d: Date, utcOffset: string) {
  const m = utcOffset.match(/^([+-])(\d{2}):(\d{2})$/);
  const off = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  const x = new Date(d.getTime() + off * 60_000);
  const hh = String(x.getUTCHours()).padStart(2, "0");
  const mm = String(x.getUTCMinutes()).padStart(2, "0");
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()} · ${hh}:${mm}`;
}

const row: CSSProperties = { display: "flex", flexDirection: "row", alignItems: "center" };
const col: CSSProperties = { display: "flex", flexDirection: "column" };
const cut = (s: string, len: number) => (s.length > len ? s.slice(0, len - 1) + "…" : s);

/** Disposición de las cartas: hasta 6 en una fila; si hay más, dos filas. */
export function cardLayout(count: number, insights = 0) {
  const perRow = count <= 6 ? Math.max(count, 1) : Math.ceil(count / 2);
  const rows = Math.ceil(count / perRow) || 1;
  const gap = 20;
  const cardW = Math.min(290, Math.floor((CARD_WIDTH - PAD * 2 - gap * (perRow - 1)) / perRow));
  const cardH = Math.round(cardW * 1.5);
  const height = HEADER_H + 44 + rows * cardH + (rows - 1) * gap + 56 + 150 + (insights ? INSIGHTS_H : 0);
  return { perRow, rows, gap, cardW, cardH, height };
}

/* ---------- Iconos (SVG propios, mismo trazo) ---------- */

function BallIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" />
      <path d="M12 7.2l3.6 2.6-1.4 4.2H9.8L8.4 9.8z" fill={color} />
      <path d="M12 2v5.2M15.6 9.8l5-1.6M14.2 14l3.2 4.2M9.8 14l-3.2 4.2M8.4 9.8l-5-1.6" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill={color} />
    </svg>
  );
}

function CardIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size * 0.72} height={size} viewBox="0 0 18 24">
      <rect x="1" y="1" width="16" height="22" rx="2.5" fill={color} />
    </svg>
  );
}

function Silhouette({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="24" r="12" fill={color} />
      <path d="M10 60c1.5-12.5 10.5-20 22-20s20.5 7.5 22 20z" fill={color} />
    </svg>
  );
}

/* ---------- Carta de jugador ---------- */

const statusStyle = (t: CardTheme): Record<PlayerStatus["kind"], { bg: string; fg: string }> => ({
  completo: { bg: `rgba(${t.shade},0.55)`, fg: t.muted },
  no_jugo: { bg: `rgba(${t.shade},0.7)`, fg: t.muted },
  parcial: { bg: "rgba(255,181,71,0.18)", fg: AMBER },
  abandono: { bg: RED, fg: "#ffffff" },
  expulsado: { bg: RED, fg: "#ffffff" },
});

function statusText(st: PlayerStatus, minutes: number) {
  switch (st.kind) {
    case "completo": return `${minutes}' JUGADOS`;
    case "no_jugo": return "NO JUGÓ";
    case "parcial": return `JUGÓ ${st.minutes}' DE ${st.of}'`;
    case "abandono": return `ABANDONÓ EN EL ${st.minute}'`;
    case "expulsado": return `EXPULSADO EN EL ${st.minute}'`;
  }
}

function Stat({ label, value, s, gold, t }: { label: string; value: string; s: number; gold: boolean; t: CardTheme }) {
  return (
    <div style={{ ...col, alignItems: "center", width: "33.33%" }}>
      <div style={{ fontSize: 18 * s, fontWeight: 600, letterSpacing: 1, color: gold ? "rgba(42,27,0,0.72)" : t.muted }}>{label}</div>
      <div style={{ fontSize: 32 * s, fontWeight: 800, lineHeight: 1.05, color: gold ? GOLD_INK : INK }}>{value}</div>
    </div>
  );
}

function PlayerCard({ p, st, mvp, avatar, w, h, t }: { p: MatchPlayer; st: PlayerStatus; mvp: boolean; avatar?: string; w: number; h: number; t: CardTheme }) {
  const s = w / 260;
  const gold = mvp && st.kind !== "no_jugo";
  const ink = gold ? GOLD_INK : INK;
  const dim = st.kind === "no_jugo";
  const red = st.kind === "abandono" || st.kind === "expulsado";
  const pass = pct(p.passes, p.passAttempts);
  const tackle = pct(p.tackles, p.tackleAttempts);
  const stats: Array<[string, string]> =
    p.pos === "goalkeeper"
      ? [["PAR", String(p.saves)], ["GOL", String(p.goals)], ["AST", String(p.assists)]]
      : [["GOL", String(p.goals)], ["AST", String(p.assists)], ["TIR", String(p.shots)]];
  stats.push(["PASES", String(p.passes)], ["PAS%", pass === null ? "-" : `${pass}`], ["ENT%", tackle === null ? "-" : `${tackle}`]);
  const band = statusStyle(t)[st.kind];
  const avatarSize = 96 * s;

  return (
    <div
      style={{
        ...col,
        width: w,
        height: h,
        borderRadius: 22 * s,
        overflow: "hidden",
        background: gold
          ? "linear-gradient(165deg, #fff4c2 0%, #efcb63 35%, #c4922f 72%, #8a6418 100%)"
          : red
            ? "linear-gradient(165deg, #3a2a5e 0%, #1d1c45 45%, #12122e 100%)"
            : t.card,
        border: gold ? "3px solid #fff1b8" : red ? `3px solid ${RED}` : `2px solid ${t.cardBorder}`,
        boxShadow: "0 14px 28px rgba(0,0,0,0.45)",
        opacity: dim ? 0.5 : 1,
      }}
    >
      <div style={{ ...col, padding: `${16 * s}px ${16 * s}px 0`, flexGrow: 1 }}>
        {/* Rating, posición y avatar */}
        <div style={{ ...row, justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ ...col, alignItems: "center", lineHeight: 1 }}>
            <div style={{ fontSize: 70 * s, fontWeight: 800, color: ink }}>{dim ? "–" : p.rating.toFixed(1)}</div>
            <div style={{ fontSize: 26 * s, fontWeight: 800, color: ink, opacity: 0.8, marginTop: 2 * s }}>{p.posLabel}</div>
          </div>
          <div
            style={{
              ...row,
              justifyContent: "center",
              width: avatarSize,
              height: avatarSize,
              borderRadius: 999,
              overflow: "hidden",
              background: gold ? "rgba(42,27,0,0.18)" : `rgba(${t.shade},0.6)`,
              border: gold ? "2px solid rgba(42,27,0,0.35)" : `2px solid rgba(${t.lineRgb},0.45)`,
            }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} width={avatarSize} height={avatarSize} style={{ objectFit: "cover" }} />
            ) : (
              <Silhouette size={avatarSize * 0.78} color={gold ? "rgba(42,27,0,0.45)" : `rgba(${t.lineRgb},0.5)`} />
            )}
          </div>
        </div>

        {/* Insignias: MVP, goles, tarjeta */}
        <div style={{ ...row, height: 34 * s, marginTop: 10 * s, columnGap: 8 * s }}>
          {gold ? (
            <div style={{ ...row, columnGap: 4 * s, background: GOLD_INK, borderRadius: 8 * s, padding: `${3 * s}px ${10 * s}px` }}>
              <StarIcon size={18 * s} color="#ffe08a" />
              <div style={{ fontSize: 19 * s, fontWeight: 800, color: "#ffe08a", letterSpacing: 1 }}>MVP</div>
            </div>
          ) : null}
          {p.goals > 0 ? (
            <div style={{ ...row, columnGap: 4 * s }}>
              <BallIcon size={28 * s} color={ink} />
              {p.goals > 1 ? <div style={{ fontSize: 22 * s, fontWeight: 800, color: ink }}>{`×${p.goals}`}</div> : null}
            </div>
          ) : null}
          {red ? <CardIcon size={28 * s} color={RED} /> : null}
        </div>

        {/* Nombre */}
        <div
          style={{
            ...row,
            justifyContent: "center",
            marginTop: 6 * s,
            fontSize: (p.name.length > 13 ? 25 : 30) * s,
            fontWeight: 800,
            color: ink,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {cut(p.name, 16)}
        </div>
        <div style={{ height: 2, background: gold ? "rgba(42,27,0,0.3)" : `rgba(${t.lineRgb},0.35)`, margin: `${8 * s}px ${4 * s}px ${10 * s}px` }} />

        {/* Stats del partido */}
        <div style={{ ...row, flexWrap: "wrap", rowGap: 10 * s }}>
          {stats.map(([l, v]) => (
            <Stat key={l} label={l} value={v} s={s} gold={gold} t={t} />
          ))}
        </div>
      </div>

      {/* Estado: minutos, abandono, expulsión */}
      <div
        style={{
          ...row,
          justifyContent: "center",
          height: 40 * s,
          marginTop: 12 * s,
          background: gold && !red ? "rgba(42,27,0,0.85)" : band.bg,
          fontSize: 20 * s,
          fontWeight: 800,
          letterSpacing: 1.5,
          color: gold && !red ? "#ffe08a" : band.fg,
        }}
      >
        {statusText(st, p.minutes)}
      </div>
    </div>
  );
}

/* ---------- Claves del partido ---------- */

function Insights({ items, t }: { items: Insight[]; t: CardTheme }) {
  const gap = 20;
  const w = Math.floor((CARD_WIDTH - PAD * 2 - gap * (items.length - 1)) / items.length);
  return (
    <div style={{ ...col, marginTop: 40, padding: `0 ${PAD}px` }}>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 2, color: t.muted, marginBottom: 12 }}>CLAVES DEL PARTIDO</div>
      <div style={{ ...row, columnGap: gap, alignItems: "stretch" }}>
        {items.map((it, i) => {
          const c = it.tone === "good" ? GOOD : AMBER;
          return (
            <div
              key={i}
              style={{
                ...col,
                justifyContent: "center",
                width: w,
                height: 86,
                padding: "0 20px",
                borderRadius: 12,
                borderLeft: `6px solid ${c}`,
                background: `rgba(${t.shade},0.6)`,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.05, color: INK }}>{cut(it.title, 44)}</div>
              {it.tip ? <div style={{ fontSize: 23, fontWeight: 600, lineHeight: 1.1, color: c, marginTop: 4 }}>{cut(it.tip, 52)}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Cabecera y comparativa ---------- */

/** Nombres de club largos bajan de tamaño para caber al lado del escudo. */
const nameSize = (name: string) => (name.length <= 12 ? 50 : name.length <= 15 ? 44 : 38);

function Crest({ src, fallback, size, t }: { src: string | null; fallback: string; size: number; t: CardTheme }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} width={size} height={size} style={{ objectFit: "contain", flexShrink: 0 }} />;
  }
  return (
    <div style={{ ...row, justifyContent: "center", width: size, height: size, borderRadius: 999, border: `3px solid rgba(${t.mutedRgb},0.35)`, fontSize: size * 0.38, fontWeight: 800, color: t.muted }}>
      {fallback}
    </div>
  );
}

function CompareBar({ label, a, b, unit = "", t }: { label: string; a: number; b: number; unit?: string; t: CardTheme }) {
  const total = a + b;
  const share = total > 0 ? a / total : 0;
  const lead = a > b ? "us" : b > a ? "them" : "tie";
  return (
    <div style={{ ...col, width: 272 }}>
      <div style={{ ...row, justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: lead === "them" ? t.muted : INK }}>{`${a}${unit}`}</div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 2, color: t.muted, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: lead === "us" ? t.muted : INK }}>{`${b}${unit}`}</div>
      </div>
      <div style={{ ...row, height: 10, borderRadius: 5, overflow: "hidden", background: `rgba(${t.mutedRgb},0.18)`, marginTop: 10 }}>
        <div style={{ width: `${Math.round(share * 100)}%`, height: 10, background: t.accent }} />
      </div>
    </div>
  );
}

export function MatchCard({
  v,
  crestUrl,
  utcOffset,
  threshold,
  extras,
  theme: t,
  insights = [],
}: {
  v: MatchView;
  insights?: Insight[];
  theme: CardTheme;
  crestUrl: string;
  utcOffset: string;
  threshold: number;
  extras: CardExtras;
}) {
  const res = RESULT[v.result] ?? { label: v.result.toUpperCase(), color: t.accent };
  const L = cardLayout(v.players.length, insights.length);
  const rows: MatchPlayer[][] = [];
  for (let i = 0; i < v.players.length; i += L.perRow) rows.push(v.players.slice(i, i + L.perRow));
  const abandonos = new Set(extras.abandonos);
  const initials = v.opponent.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const passA = pct(v.us.passes, v.us.passAttempts) ?? 0;
  const passB = v.them ? pct(v.them.passes, v.them.passAttempts) ?? 0 : 0;
  const tackA = pct(v.us.tackles, v.us.tackleAttempts) ?? 0;
  const tackB = v.them ? pct(v.them.tackles, v.them.tackleAttempts) ?? 0 : 0;
  const sideW = 470;

  return (
    <div
      style={{
        ...col,
        width: CARD_WIDTH,
        height: L.height,
        fontFamily: "Barlow Condensed",
        color: INK,
        background: t.bg,
      }}
    >
      {/* Cabecera: banda del color de fondo del escudo para que se funda con él */}
      <div style={{ ...row, height: HEADER_H, padding: `0 ${PAD}px`, background: t.header, borderBottom: `4px solid ${res.color}` }}>
        <div style={{ ...row, width: sideW, flexShrink: 0, columnGap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={crestUrl}
            width={180}
            height={180}
            style={{ flexShrink: 0, maskImage: "radial-gradient(circle at 50% 50%, black 52%, transparent 70%)" }}
          />
          <div style={{ ...row, flexGrow: 1, justifyContent: "flex-end", fontSize: nameSize(v.clubName), fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap" }}>{cut(v.clubName, 18)}</div>
        </div>

        <div style={{ ...col, alignItems: "center", flexGrow: 1 }}>
          <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 0.95, letterSpacing: -1 }}>{`${v.goalsFor} – ${v.goalsAgainst}`}</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 2.5, color: "#04101f", background: res.color, borderRadius: 8, padding: "2px 16px", marginTop: 12 }}>{res.label}</div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: 1, color: t.muted, marginTop: 8 }}>{`${TYPE_LABEL[v.type]} · ${localDate(v.playedAt, utcOffset)}`}</div>
        </div>

        <div style={{ ...row, width: sideW, flexShrink: 0, columnGap: 18 }}>
          <div style={{ ...row, flexGrow: 1, fontSize: nameSize(v.opponent), fontWeight: 800, lineHeight: 1, color: t.opponentInk, whiteSpace: "nowrap" }}>{cut(v.opponent, 18)}</div>
          <Crest src={extras.opponentCrest} fallback={initials || "?"} size={160} t={t} />
        </div>
      </div>

      {/* Cartas */}
      <div style={{ ...col, marginTop: 44, rowGap: L.gap, padding: `0 ${PAD}px` }}>
        {rows.map((r, i) => (
          <div key={i} style={{ ...row, justifyContent: "center", columnGap: L.gap }}>
            {r.map((p) => (
              <PlayerCard
                key={p.eaPlayerId}
                p={p}
                st={playerStatus(p, v.maxSeconds, threshold, abandonos.has(p.eaPlayerId))}
                mvp={p.eaPlayerId === v.mvp?.eaPlayerId}
                avatar={extras.avatars[p.eaPlayerId]}
                w={L.cardW}
                h={L.cardH}
                t={t}
              />
            ))}
          </div>
        ))}
      </div>

      {insights.length ? <Insights items={insights} t={t} /> : null}

      {/* Comparativa */}
      {v.them ? (
        <div style={{ ...col, marginTop: "auto", padding: `0 ${PAD}px 40px` }}>
          <div style={{ ...row, justifyContent: "space-between", fontSize: 22, fontWeight: 600, letterSpacing: 2, color: t.muted, marginBottom: 14 }}>
            <div>{v.clubName.toUpperCase()}</div>
            <div>{cut(v.opponent.toUpperCase(), 24)}</div>
          </div>
          <div style={{ ...row, justifyContent: "space-between" }}>
            <CompareBar label="TIROS" a={v.us.shots} b={v.them.shots} t={t} />
            <CompareBar label="PASES" a={passA} b={passB} unit="%" t={t} />
            <CompareBar label="ENTRADAS" a={tackA} b={tackB} unit="%" t={t} />
            <CompareBar label="PARADAS" a={v.us.saves} b={v.them.saves} t={t} />
            <CompareBar label="ROJAS" a={v.us.reds} b={v.them.reds} t={t} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

