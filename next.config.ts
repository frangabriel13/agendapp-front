import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * El botón de dev tools de Next se dibuja abajo a la izquierda, justo encima
   * del engranaje del riel del panel, y lo tapa.
   *
   * `position: "bottom-right"` está documentado pero en 16.2.6 no movió nada al
   * probarlo, así que la única salida que funciona es apagarlo. Next sigue
   * mostrando los errores de build y de runtime igual.
   *
   * Solo afecta a desarrollo. Se saca esta línea y vuelve.
   */
  devIndicators: false,
};

export default nextConfig;
