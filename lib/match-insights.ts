/**
 * "Claves del partido": hasta 3 frases automáticas con lo que salió bien y lo que hay que mejorar.
 * Reglas fijas sobre las estadísticas de EA (no hay posesión, faltas ni fueras de juego).
 * Umbrales calibrados con los partidos reales de los dos clubes (2026-11-24, 42 partidos):
 *   pases 70/75/78/81/84 % (p10/p25/p50/p75/p90) · entradas 19/26/30/39/44 % · tiros 3/4/6/7/9
 *   pases de defensas 62/71/80/86/90 % · conversión 13/33/46/54/67 %
 * Nivel 1 = algo claramente fuera de lo normal; nivel 2 = señal más suave, solo rellena hasta 3.
 * Los partidos en que el rival abandona también cuentan (son muchos): los porcentajes siguen sirviendo.
 */
import { pct, type MatchView } from "./match-data";

export interface Insight {
  tone: "good" | "bad";
  title: string; // qué pasó, con el dato
  tip?: string; // qué hacer (solo en las malas)
}

interface Candidate extends Insight {
  tier: 1 | 2;
  weight: number;
}

const MAX = 3;
const MAX_BAD = 2;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function matchInsights(v: MatchView): Insight[] {
  // Sin rival o partido de menos de 10 min (el rival se fue enseguida): no hay con qué opinar
  if (!v.them || v.maxSeconds < 600) return [];
  // Partido cortado por abandono: los totales (tiros) no son comparables con 90'
  const full = v.maxSeconds >= 4500;
  const us = v.us, them = v.them;
  const pass = us.passAttempts >= 20 ? pct(us.passes, us.passAttempts) : null;
  const tackle = us.tackleAttempts >= 8 ? pct(us.tackles, us.tackleAttempts) : null;
  const group = (pos: string) => v.players.filter((p) => p.pos === pos && p.seconds > 0);
  const groupPass = (pos: string) => {
    const g = group(pos);
    const att = g.reduce((t, p) => t + p.passAttempts, 0);
    return att >= 10 ? pct(g.reduce((t, p) => t + p.passes, 0), att) : null;
  };
  const defPass = groupPass("defender");
  const midPass = groupPass("midfielder");
  const conv = us.shots > 0 ? Math.round((v.goalsFor / us.shots) * 100) : null;
  const keeper = group("goalkeeper")[0];

  const c: Candidate[] = [];
  const bad = (tier: 1 | 2, weight: number, title: string, tip: string) => c.push({ tone: "bad", tier, weight, title, tip });
  const good = (tier: 1 | 2, weight: number, title: string) => c.push({ tone: "good", tier, weight, title });

  /* ----- A mejorar ----- */
  if (v.goalsAgainst >= 3) bad(1, 5, `${v.goalsAgainst} goles en contra`, "Revisar marcas y que los medios ayuden atrás");
  else if (v.goalsAgainst === 2) bad(2, 3, "2 goles en contra", "Cerrar mejor los espacios atrás");

  if (tackle !== null && tackle < 22) bad(1, 4, `Defensa floja: ${tackle}% de entradas ganadas`, "Menos entradas a lo loco, cerrar espacios y esperar");
  else if (tackle !== null && tackle < 30) bad(2, 2.5, `Pocas entradas ganadas: ${tackle}%`, "Entrar con más cabeza, mejor temporizar");

  if (them.shots >= us.shots + 4) bad(1, 3.5, `El rival tiró más: ${them.shots} contra ${us.shots}`, "Presionar antes y no dejarles tirar de lejos");
  else if (them.shots >= us.shots && them.shots >= 6) bad(2, 2, `El rival tiró tanto como nosotros: ${them.shots} contra ${us.shots}`, "Cerrar más los tiros del rival");

  if (defPass !== null && defPass < 68) bad(1, 3, `Salida desde atrás floja: ${defPass}% de pases de los defensas`, "Mejorar pases en defensa: pase corto y al pie");
  else if (pass !== null && pass < 72) bad(1, 3, `Pocos pases buenos: ${pass}% de acierto`, "Tocar más corto y no forzar el pase largo");
  else if (defPass !== null && defPass < 76) bad(2, 2, `Defensas con ${defPass}% de pases`, "Mejorar pases en defensa, buscar al medio libre");
  else if (midPass !== null && midPass < 74) bad(2, 2, `Medio campo con ${midPass}% de pases`, "Menos pérdidas en el medio, jugar a uno o dos toques");
  else if (pass !== null && pass < 77) bad(2, 1.5, `Pases mejorables: ${pass}%`, "Más apoyos cortos al que tiene el balón");

  if (full && us.shots <= 3) bad(1, 2.5, `Poco ataque: solo ${plural(us.shots, "tiro", "tiros")}`, "Llegar más al área y probar de media distancia");
  else if (us.shots >= 7 && conv !== null && conv < 20) bad(1, 2.5, `Falta puntería: ${us.shots} tiros, ${plural(v.goalsFor, "gol", "goles")}`, "Elegir mejor el tiro y buscar el pase atrás");
  else if (us.shots >= 5 && conv !== null && conv < 30) bad(2, 1.8, `Se pudo marcar más: ${us.shots} tiros, ${plural(v.goalsFor, "gol", "goles")}`, "Afinar la definición dentro del área");

  /* ----- Lo bueno ----- */
  if (keeper && keeper.saves >= 5) good(1, 3.5, `Partidazo del portero: ${keeper.saves} paradas`);
  else if (keeper && keeper.saves >= 3) good(2, 2, `Buen trabajo del portero: ${keeper.saves} paradas`);

  if (v.goalsAgainst === 0) good(1, 3, "Portería a cero");
  else if (v.goalsAgainst === 1 && them.shots >= 5) good(2, 1.5, `Solo 1 gol en contra con ${them.shots} tiros del rival`);

  if (conv !== null && conv >= 60 && v.goalsFor >= 3) good(1, 2.5, `Muy efectivos: ${v.goalsFor} goles en ${us.shots} tiros`);
  else if (conv !== null && conv >= 45 && v.goalsFor >= 2) good(2, 1.8, `Buena definición: ${v.goalsFor} goles en ${us.shots} tiros`);

  if (pass !== null && pass >= 84) good(1, 2, `Buena circulación: ${pass}% de pases`);
  else if (pass !== null && pass >= 80) good(2, 1.5, `Pases seguros: ${pass}% de acierto`);

  if (tackle !== null && tackle >= 44) good(1, 2, `Defensa sólida: ${tackle}% de entradas ganadas`);
  else if (tackle !== null && tackle >= 38) good(2, 1.6, `Buenas entradas: ${tackle}% ganadas`);

  if (us.shots >= them.shots + 5) good(1, 1.5, `Dominamos: ${us.shots} tiros contra ${them.shots}`);
  else if (us.shots >= them.shots + 2) good(2, 1.2, `Más llegada que el rival: ${us.shots} tiros contra ${them.shots}`);

  if (v.mvp && v.mvp.goals + v.mvp.assists >= 2)
    good(2, 1, `${v.mvp.name}: ${[v.mvp.goals && plural(v.mvp.goals, "gol", "goles"), v.mvp.assists && plural(v.mvp.assists, "asistencia", "asistencias")].filter(Boolean).join(" y ")}`);

  /* ----- Selección: primero nivel 1, luego nivel 2; máximo 2 malas y al menos 1 buena si la hay ----- */
  const order = (a: Candidate, b: Candidate) => a.tier - b.tier || b.weight - a.weight;
  const bads = c.filter((x) => x.tone === "bad").sort(order);
  const goods = c.filter((x) => x.tone === "good").sort(order);
  const picked: Candidate[] = [];
  if (goods.length) picked.push(goods.shift()!);
  for (const x of [...bads.slice(0, MAX_BAD), ...goods].sort(order)) {
    if (picked.length >= MAX) break;
    picked.push(x);
  }
  // Malas primero, luego buenas
  picked.sort((a, b) => (a.tone === b.tone ? order(a, b) : a.tone === "bad" ? -1 : 1));
  return picked.map(({ tone, title, tip }) => (tip ? { tone, title, tip } : { tone, title }));
}
