import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import Providers from "./providers"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reservapp.com.ar"
const title = "reservApp — Gestión de turnos para estéticas"
const description =
  "El sistema de agenda más completo para estéticas y centros de belleza en Argentina. Turnos, recordatorios y ficha clínica en un solo lugar."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · reservApp",
  },
  description,
  keywords: ["agenda estética", "turnos belleza", "software estética", "ficha clínica", "reservApp", "Argentina"],
  authors: [{ name: "reservApp" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: "reservApp",
    title,
    description,
    images: [{ url: "/logoReservApp.png", alt: "reservApp" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logoReservApp.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} scroll-smooth`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
