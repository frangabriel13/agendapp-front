import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reservapp.com.ar"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/activar`, `/restablecer` y `/verificar-email` llevan un token de un
      // solo uso en la query: además de no aportar nada indexadas, un crawler que
      // las visite quema el link.
      //
      // `/pago` y `/suscripcion` son las vueltas del checkout: llevan
      // identificadores del cobro y solo tienen sentido inmediatamente después de
      // pagar.
      disallow: [
        "/dashboard",
        "/agenda",
        "/reportes",
        "/equipo",
        "/servicios",
        "/clientes",
        "/sucursales",
        "/configuracion",
        "/login",
        "/registro",
        "/olvide-contrasena",
        "/activar",
        "/restablecer",
        "/verificar-email",
        "/pago",
        "/suscripcion",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
