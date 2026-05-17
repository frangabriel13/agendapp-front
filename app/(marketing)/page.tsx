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
    <div className="min-h-screen bg-white text-gray-900">
      <Nav />
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
      <Footer />
    </div>
  )
}
