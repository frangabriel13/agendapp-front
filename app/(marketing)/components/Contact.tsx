import { Card } from "../ui/Card"
import { Section } from "../ui/Section"
import { SectionHeading } from "../ui/SectionHeading"
import { ContactForm } from "./ContactForm"

export function Contact() {
  return (
    <Section id="contacto" width="narrow">
      <SectionHeading
        badge="Contacto"
        title="¿Tenés alguna pregunta?"
        subtitle="Completá el formulario y te respondemos en menos de 24hs."
        className="mb-10"
      />
      <Card className="mx-auto max-w-xl p-6 md:p-8">
        <ContactForm />
      </Card>
    </Section>
  )
}
