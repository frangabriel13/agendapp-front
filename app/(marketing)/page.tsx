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
    // `overflow-x-clip` contiene los halos del fondo: son más anchos que la
    // pantalla y sin esto aparece scroll horizontal en mobile.
    <div className="min-h-screen overflow-x-clip bg-white text-neutral-900 antialiased">
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
