/**
 * Lámina horizontal del partido (se renderiza a PNG con next/og):
 * cabecera con marcador, una carta por jugador con sus stats y comparativa de equipos.
 * Ojo: satori solo entiende flexbox; todo div con varios hijos necesita display:flex.
 */
import type { CSSProperties } from "react";
import { pct, TYPE_LABEL, type MatchPlayer, type MatchView } from "./match-data";

export const CARD_WIDTH = 1600;

const RESULT: Record<string, { label: string; color: string }> = {
  victoria: { label: "VICTORIA", color: "#2ecc71" },
  victoria_dnf: { label: "VICTORIA · RIVAL ABANDONÓ", color: "#2ecc71" },
  derrota: { label: "DERROTA", color: "#e74c3c" },
  derrota_dnf: { label: "DERROTA · ABANDONAMOS", color: "#e74c3c" },
  empate: { label: "EMPATE", color: "#95a5a6" },
};

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

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

/** Disposición de las cartas: hasta 6 en una fila; si hay más, dos filas. */
export function cardLayout(count: number) {
  const perRow = count <= 6 ? Math.max(count, 1) : Math.ceil(count / 2);
  const rows = Math.ceil(count / perRow) || 1;
  const gap = 18;
  const cardW = Math.min(236, Math.floor((CARD_WIDTH - 96 - gap * (perRow - 1)) / perRow));
  const cardH = Math.round(cardW * 1.36);
  const height = 250 + rows * cardH + (rows - 1) * gap + 30 + 150;
  return { perRow, rows, gap, cardW, cardH, height };
}

function Stat({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <div style={{ ...col, alignItems: "center", width: "33%" }}>
      <div style={{ fontSize: 15, letterSpacing: 1, color: dark ? "rgba(40,26,0,0.7)" : "rgba(200,220,255,0.65)" }}>{label}</div>
      <div style={{ fontSize: 27, fontWeight: 800, color: dark ? "#2a1b00" : "#ffffff" }}>{value}</div>
    </div>
  );
}

function PlayerCard({ p, mvp, w, h }: { p: MatchPlayer; mvp: boolean; w: number; h: number }) {
  const s = w / 236; // escala para cartas más pequeñas
  const gk = p.pos === "goalkeeper";
  const pass = pct(p.passes, p.passAttempts);
  const tackle = pct(p.tackles, p.tackleAttempts);
  const ink = mvp ? "#2a1b00" : "#ffffff";
  return (
    <div
      style={{
        ...col,
        width: w,
        height: h,
        borderRadius: 22 * s,
        padding: `${14 * s}px ${14 * s}px ${12 * s}px`,
        background: mvp
          ? "linear-gradient(160deg, #fff1b8 0%, #e8c25a 38%, #b8862b 75%, #7a5714 100%)"
          : "linear-gradient(160deg, #2a56b8 0%, #14306e 40%, #0b1a3d 75%, #070f24 100%)",
        border: mvp ? "3px solid #fff3c4" : "2px solid #4b7cf0",
        boxShadow: mvp ? "0 0 28px rgba(255,210,90,0.55)" : "0 0 18px rgba(40,110,255,0.35)",
        position: "relative",
        opacity: p.seconds > 0 ? 1 : 0.45, // estuvo en la sala pero no jugó
      }}
    >
      {/* Rating + posición + insignias */}
      <div style={{ ...row, justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ ...col, alignItems: "center", lineHeight: 1 }}>
          <div style={{ fontSize: 62 * s, fontWeight: 800, color: ink }}>{p.rating.toFixed(1)}</div>
          <div style={{ fontSize: 24 * s, fontWeight: 600, color: ink, opacity: 0.85, marginTop: 4 * s }}>{p.posLabel}</div>
        </div>
        <div style={{ ...col, alignItems: "flex-end" }}>
          {mvp ? (
            <div style={{ fontSize: 18 * s, fontWeight: 800, color: "#fff3c4", background: "#2a1b00", borderRadius: 8, padding: `${2 * s}px ${10 * s}px` }}>MVP</div>
          ) : null}
          {p.redcards > 0 ? (
            <div style={{ width: 18 * s, height: 26 * s, background: "#e53935", borderRadius: 3, marginTop: 8 * s }} />
          ) : null}
        </div>
      </div>

      {/* Nombre */}
      <div
        style={{
          ...row,
          justifyContent: "center",
          marginTop: "auto",
          fontSize: (p.name.length > 13 ? 22 : 27) * s,
          fontWeight: 800,
          color: ink,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name}
      </div>
      <div style={{ height: 2, background: mvp ? "rgba(42,27,0,0.35)" : "rgba(120,170,255,0.4)", margin: `${8 * s}px ${6 * s}px` }} />

      {/* Stats del partido */}
      <div style={{ ...row, flexWrap: "wrap", rowGap: 6 * s }}>
        <Stat label="GOL" value={String(p.goals)} dark={mvp} />
        <Stat label="AST" value={String(p.assists)} dark={mvp} />
        {gk ? <Stat label="PAR" value={String(p.saves)} dark={mvp} /> : <Stat label="TIR" value={String(p.shots)} dark={mvp} />}
        <Stat label="PAS" value={pass === null ? "-" : `${pass}%`} dark={mvp} />
        <Stat label="ENT" value={tackle === null ? "-" : `${tackle}%`} dark={mvp} />
        <Stat label="MIN" value={`${p.minutes}'`} dark={mvp} />
      </div>
    </div>
  );
}

function CompareBar({ label, a, b, fmt = (v: number) => String(v) }: { label: string; a: number; b: number; fmt?: (v: number) => string }) {
  const total = a + b;
  const share = total > 0 ? a / total : 0;
  return (
    <div style={{ ...col, width: 270 }}>
      <div style={{ ...row, justifyContent: "space-between" }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: "#ffffff" }}>{fmt(a)}</div>
        <div style={{ fontSize: 18, letterSpacing: 2, color: "rgba(200,220,255,0.7)" }}>{label}</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>{fmt(b)}</div>
      </div>
      <div style={{ ...row, height: 10, borderRadius: 5, overflow: "hidden", background: "rgba(255,255,255,0.15)", marginTop: 8 }}>
        <div style={{ width: `${Math.round(share * 100)}%`, height: 10, background: "linear-gradient(90deg, #2f7bff, #6fb1ff)" }} />
      </div>
    </div>
  );
}

export function MatchCard({ v, crestUrl, utcOffset }: { v: MatchView; crestUrl: string; utcOffset: string }) {
  const res = RESULT[v.result] ?? { label: v.result.toUpperCase(), color: "#1e6bff" };
  const L = cardLayout(v.players.length);
  const rows: MatchPlayer[][] = [];
  for (let i = 0; i < v.players.length; i += L.perRow) rows.push(v.players.slice(i, i + L.perRow));
  const mvpName = v.mvp?.name;
  const passA = pct(v.us.passes, v.us.passAttempts) ?? 0, passB = v.them ? pct(v.them.passes, v.them.passAttempts) ?? 0 : 0;
  const tackA = pct(v.us.tackles, v.us.tackleAttempts) ?? 0, tackB = v.them ? pct(v.them.tackles, v.them.tackleAttempts) ?? 0 : 0;
  const initials = v.opponent.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div
      style={{
        ...col,
        width: CARD_WIDTH,
        height: L.height,
        padding: "34px 48px",
        fontFamily: "Barlow Condensed",
        color: "#ffffff",
        background: "radial-gradient(circle at 50% 0%, #163a8a 0%, #0a1a40 35%, #030a1c 75%)",
      }}
    >
      {/* Cabecera */}
      <div style={{ ...row, justifyContent: "space-between", height: 190 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={crestUrl} width={180} height={180} style={{ borderRadius: 24 }} />
        <div style={{ ...col, alignItems: "center", flexGrow: 1 }}>
          <div style={{ fontSize: 24, letterSpacing: 4, color: "rgba(200,220,255,0.75)" }}>
            {`${TYPE_LABEL[v.type].toUpperCase()} · ${localDate(v.playedAt, utcOffset)}`}
          </div>
          <div style={{ ...row, marginTop: 4 }}>
            <div style={{ fontSize: 52, fontWeight: 800, width: 420, justifyContent: "flex-end", display: "flex" }}>{v.clubName}</div>
            <div style={{ fontSize: 110, fontWeight: 800, margin: "0 36px", lineHeight: 1 }}>{`${v.goalsFor} - ${v.goalsAgainst}`}</div>
            <div style={{ fontSize: 52, fontWeight: 800, width: 420, color: "rgba(255,255,255,0.8)", display: "flex" }}>
              {v.opponent.length > 18 ? v.opponent.slice(0, 17) + "…" : v.opponent}
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 3, color: "#06101f", background: res.color, borderRadius: 999, padding: "4px 28px", marginTop: 6 }}>
            {res.label}
          </div>
        </div>
        <div
          style={{
            ...row,
            justifyContent: "center",
            width: 160,
            height: 160,
            borderRadius: 999,
            border: "3px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.06)",
            fontSize: 64,
            fontWeight: 800,
            color: "rgba(255,255,255,0.7)",
            marginRight: 10,
          }}
        >
          {initials || "?"}
        </div>
      </div>

      {/* Cartas */}
      <div style={{ ...col, marginTop: 40, rowGap: L.gap }}>
        {rows.map((r, i) => (
          <div key={i} style={{ ...row, justifyContent: "center", columnGap: L.gap }}>
            {r.map((p) => (
              <PlayerCard key={p.name} p={p} mvp={p.name === mvpName} w={L.cardW} h={L.cardH} />
            ))}
          </div>
        ))}
      </div>

      {/* Comparativa */}
      {v.them ? (
        <div style={{ ...col, marginTop: "auto" }}>
          <div style={{ ...row, justifyContent: "space-between", fontSize: 20, letterSpacing: 3, color: "rgba(200,220,255,0.6)", marginBottom: 12 }}>
            <div>{v.clubName.toUpperCase()}</div>
            <div>{v.opponent.toUpperCase()}</div>
          </div>
          <div style={{ ...row, justifyContent: "space-between" }}>
            <CompareBar label="TIROS" a={v.us.shots} b={v.them.shots} />
            <CompareBar label="PASES" a={passA} b={passB} fmt={(x) => `${x}%`} />
            <CompareBar label="ENTRADAS" a={tackA} b={tackB} fmt={(x) => `${x}%`} />
            <CompareBar label="PARADAS" a={v.us.saves} b={v.them.saves} />
            <CompareBar label="ROJAS" a={v.us.reds} b={v.them.reds} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
