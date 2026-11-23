"use client";
import { useState } from "react";

export function CopyName({ name }: { name: string }) {
  const [state, setState] = useState<"idle" | "ok" | "error">("idle");

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(name);
      ok = true;
    } catch {
      // Navegadores dentro de apps (Discord, Twitch) a veces bloquean la API: método antiguo
      const ta = document.createElement("textarea");
      ta.value = name;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    setState(ok ? "ok" : "error");
    setTimeout(() => setState("idle"), 2200);
  }

  return (
    <button type="button" className="copy" data-state={state} onClick={copy}>
      <span className="copy-label">
        {state === "ok" ? "Copiado. Pégalo en Buscar club" : state === "error" ? "No se pudo copiar: escríbelo tal cual" : "Nombre exacto en EA FC 27"}
      </span>
      <span className="copy-action" aria-hidden="true">
        {state === "ok" ? (
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20"><rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M16 5.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        )}
        {state === "ok" ? "Listo" : "Copiar"}
      </span>
      <span className="sr-only" aria-live="polite">{state === "ok" ? "Nombre copiado" : ""}</span>
    </button>
  );
}
