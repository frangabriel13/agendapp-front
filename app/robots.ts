import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reservapp.com.ar"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/agenda", "/equipo", "/configuracion", "/login", "/registro", "/olvide-contrasena"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
