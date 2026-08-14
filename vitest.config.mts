import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": resolve(import.meta.dirname, ".") },
  },
  test: {
    /**
     * Los tests corren en la zona del mercado, no en la de la máquina.
     *
     * Varias trampas de fechas solo se manifiestan con offset negativo: la más
     * cara es que `new Date("2026-12-25")` se interpreta como UTC y en América
     * retrocede al día 24. En un servidor en UTC —o en cualquier CI— ese bug
     * pasa desapercibido y el test lo aprueba sin probar nada.
     */
    env: { TZ: "America/Argentina/Buenos_Aires" },
  },
})
