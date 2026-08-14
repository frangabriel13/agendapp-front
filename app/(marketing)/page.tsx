import { TopBackdrop } from "./ui/TopBackdrop"
import { Nav } from "./components/Nav"
import { Hero } from "./components/Hero"
import { TrustStrip } from "./components/TrustStrip"
import { Features } from "./components/Features"
import { HowItWorks } from "./components/HowItWorks"
import { Testimonials } from "./components/Testimonials"
import { Pricing } from "./components/Pricing"
import { Faq } from "./components/Faq"
import { About } from "./components/About"
import { Contact } from "./components/Contact"
import { FinalCta } from "./components/FinalCta"
import { Footer } from "./components/Footer"

export default function MarketingPage() {
  return (
    // `isolate` mantiene el halo del fondo (`-z-10`) por encima del blanco de la
    // página en vez de mandarlo detrás. `overflow-x-clip` lo contiene a lo ancho:
    // es más ancho que la pantalla y si no aparece scroll horizontal en mobile.
    // Tiene que ser `clip` y no `hidden`, que crearía un scroll container y
    // rompería el `sticky` del nav.
    <div className="relative isolate min-h-screen overflow-x-clip bg-white text-neutral-900 antialiased">
      <TopBackdrop />
      <Nav />
      <main>
        <Hero />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <Faq />
        <About />
        <Contact />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
