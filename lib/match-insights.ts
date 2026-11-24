/**
 * "Claves del partido": 2-3 frases automáticas con lo que salió bien y lo que hay que mejorar.
 * Reglas fijas sobre las estadísticas de EA (no hay posesión, faltas ni fueras de juego).
 * Umbrales calibrados con los partidos reales de los dos clubes (2026-11-24, 42 partidos):
 *   pases 70/75/78/81/84 % (p10/p25/p50/p75/p90) · entradas 19/26/30/39/44 % · tiros 3/4/6/7/9
 *   pases de defensas 62/71/80/86/90 % · conversión 13/33/46/54/67 %
 */
import { pct, type MatchView } from "./match-data";

export interface Insight {
  tone: "good" | "bad";
  title: string; // qué pasó, con el dato
  tip?: string; // qué hacer (solo en las malas)
}

const MAX = 3;

export function matchInsights(v: MatchView): Insight[] {
  // Partidos cortados por abandono: las estadísticas no son comparables
  if (!v.them || v.result.endsWith("_dnf") || v.maxSeconds < 3000) return [];
  const us = v.us, them = v.them;
  const pass = pct(us.passes, us.passAttempts);
  const tackle = us.tackleAttempts >= 8 ? pct(us.tackles, us.tackleAttempts) : null;
  const defs = v.players.filter((p) => p.pos === "defender" && p.seconds > 0);
  const defAtt = defs.reduce((t, p) => t + p.passAttempts, 0);
  const defPass = defAtt >= 10 ? pct(defs.reduce((t, p) => t + p.passes, 0), defAtt) : null;
  const conv = us.shots > 0 ? Math.round((v.goalsFor / us.shots) * 100) : null;
  const keeper = v.players.find((p) => p.pos === "goalkeeper" && p.seconds > 0);

  // [peso, insight]: a mayor peso, más importante
  const bad: Array<[number, Insight]> = [];
  const good: Array<[number, Insight]> = [];

  if (v.goalsAgainst >= 3)
    bad.push([5, { tone: "bad", title: `${v.goalsAgainst} goles en contra`, tip: "Revisar marcas y que los medios ayuden atrás" }]);
  if (tackle !== null && tackle < 22)
    bad.push([4, { tone: "bad", title: `Defensa floja: ${tackle}% de entradas ganadas`, tip: "Menos entradas a lo loco, cerrar espacios y esperar" }]);
  if (them.shots >= us.shots + 4)
    bad.push([3.5, { tone: "bad", title: `El rival tiró más: ${them.shots} contra ${us.shots}`, tip: "Presionar antes y no dejarles tirar de lejos" }]);
  if (defPass !== null && defPass < 68)
    bad.push([3, { tone: "bad", title: `Salida desde atrás floja: ${defPass}% de pases de los defensas`, tip: "Mejorar pases en defensa: pase corto y al pie" }]);
  else if (pass !== null && pass < 72)
    bad.push([3, { tone: "bad", title: `Pocos pases buenos: ${pass}% de acierto`, tip: "Tocar más corto y no forzar el pase largo" }]);
  if (us.shots <= 3)
    bad.push([2.5, { tone: "bad", title: `Poco ataque: solo ${us.shots} ${us.shots === 1 ? "tiro" : "tiros"}`, tip: "Llegar más al área y probar de media distancia" }]);
  else if (us.shots >= 7 && conv !== null && conv < 20)
    bad.push([2.5, { tone: "bad", title: `Falta puntería: ${us.shots} tiros, ${v.goalsFor} ${v.goalsFor === 1 ? "gol" : "goles"}`, tip: "Elegir mejor el tiro y buscar el pase atrás" }]);

  if (v.goalsAgainst === 0) good.push([3, { tone: "good", title: "Portería a cero" }]);
  if (keeper && keeper.saves >= 5) good.push([3.5, { tone: "good", title: `Partidazo del portero: ${keeper.saves} paradas` }]);
  if (conv !== null && conv >= 60 && v.goalsFor >= 3) good.push([2.5, { tone: "good", title: `Muy efectivos: ${v.goalsFor} goles en ${us.shots} tiros` }]);
  if (pass !== null && pass >= 84) good.push([2, { tone: "good", title: `Buena circulación: ${pass}% de pases` }]);
  if (tackle !== null && tackle >= 44) good.push([2, { tone: "good", title: `Defensa sólida: ${tackle}% de entradas ganadas` }]);
  if (us.shots >= them.shots + 5) good.push([1.5, { tone: "good", title: `Dominamos: ${us.shots} tiros contra ${them.shots}` }]);

  const byWeight = (a: [number, Insight], b: [number, Insight]) => b[0] - a[0];
  bad.sort(byWeight);
  good.sort(byWeight);
  // Hasta 2 cosas a mejorar y lo bueno rellena (siempre al menos una buena si la hay)
  const picked = bad.slice(0, good.length ? MAX - 1 : MAX);
  picked.push(...good.slice(0, MAX - picked.length));
  return picked.map(([, i]) => i);
}
