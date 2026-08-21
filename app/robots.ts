import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reservapp.com.ar"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Las tres últimas llevan un token de un solo uso en la query: además de
      // no aportar nada indexadas, un crawler que las visite quema el link.
      disallow: [
        "/dashboard",
        "/agenda",
        "/equipo",
        "/configuracion",
        "/login",
        "/registro",
        "/olvide-contrasena",
        "/activar",
        "/restablecer",
        "/verificar-email",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
