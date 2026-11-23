"use client";
import { useEffect } from "react";

/**
 * Luz por proximidad: las filas `.lum` se encienden cuando el puntero se acerca
 * (escritorio) o cuando cruzan el centro de la pantalla al hacer scroll (móvil).
 */
export function Proximity() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".lum"));
    if (!items.length) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      let raf = 0;
      const onMove = (e: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          for (const el of items) {
            const r = el.getBoundingClientRect();
            const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
            const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
            const near = Math.max(0, 1 - Math.hypot(dx, dy) / 140);
            el.style.setProperty("--near", near.toFixed(3));
            el.style.setProperty("--mx", `${e.clientX - r.left}px`);
          }
        });
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      return () => {
        window.removeEventListener("pointermove", onMove);
        cancelAnimationFrame(raf);
      };
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const el = en.target as HTMLElement;
          el.style.setProperty("--near", en.isIntersecting ? "1" : "0");
          el.style.setProperty("--mx", "50%");
        }
      },
      { rootMargin: "-38% 0px -38% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
