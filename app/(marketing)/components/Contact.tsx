import { ContactForm } from "./ContactForm"

export function Contact() {
  return (
    <section id="contacto" className="px-6 py-20 bg-gray-50 border-y border-gray-200 scroll-mt-20">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">¿Tenés alguna pregunta?</h2>
          <p className="text-gray-500">Completá el formulario y te respondemos en menos de 24hs.</p>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
