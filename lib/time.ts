/**
 * Convierte fecha + hora local del club a Date.
 * fecha: "AAAA-MM-DD", "hoy" o "mañana"; hora: "HH:MM" (24h).
 */
export function parseLocalDateTime(fecha: string, hora: string, utcOffset: string): Date | null {
  const h = hora.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!h || Number(h[1]) > 23 || Number(h[2]) > 59) return null;
  const hh = h[1].padStart(2, "0");

  let day = fecha.trim().toLowerCase();
  if (day === "hoy" || day === "mañana" || day === "manana") {
    const offsetMin = offsetToMinutes(utcOffset);
    const localNow = new Date(Date.now() + offsetMin * 60_000);
    if (day !== "hoy") localNow.setUTCDate(localNow.getUTCDate() + 1);
    day = localNow.toISOString().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;

  const d = new Date(`${day}T${hh}:${h[2]}:00${utcOffset}`);
  return isNaN(d.getTime()) ? null : d;
}

function offsetToMinutes(offset: string): number {
  const m = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) return 0;
  const v = Number(m[2]) * 60 + Number(m[3]);
  return m[1] === "-" ? -v : v;
}
