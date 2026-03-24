import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { PublishedFormShell, PublishedHero } from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "Contact | KORYXA",
  description: "Une question ? Un projet ? Notre équipe est à votre écoute.",
};

export default function ContactPage() {
  return (
    <main>
      <PublishedHero
        title="Contactez-nous"
        description="Une question ? Un projet ? Notre équipe est à votre écoute."
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-bold text-slate-950">Envoyez-nous un message</h2>
            <PublishedFormShell>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="text-sm font-medium text-slate-700">Nom</label>
                  <input id="name" placeholder="Votre nom" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                  <input id="email" type="email" placeholder="votre@email.com" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" />
                </div>
                <div>
                  <label htmlFor="subject" className="text-sm font-medium text-slate-700">Sujet</label>
                  <input id="subject" placeholder="Objet de votre message" className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" />
                </div>
                <div>
                  <label htmlFor="message" className="text-sm font-medium text-slate-700">Message</label>
                  <textarea id="message" rows={6} placeholder="Votre message..." className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-sky-400" />
                </div>
                <button type="button" className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
                  Envoyer
                </button>
              </form>
            </PublishedFormShell>
          </div>

          <div>
            <h2 className="mb-6 text-2xl font-bold text-slate-950">Informations de contact</h2>
            <div className="space-y-6">
              {[
                { icon: <Mail className="h-6 w-6 text-sky-600" />, title: "Email", text: "contact@koryxa.com", bg: "bg-sky-100" },
                { icon: <MapPin className="h-6 w-6 text-emerald-600" />, title: "Adresse", text: "Dakar, Sénégal", bg: "bg-emerald-100" },
                { icon: <Phone className="h-6 w-6 text-amber-600" />, title: "Téléphone", text: "+221 XX XXX XX XX", bg: "bg-amber-100" },
              ].map((item) => (
                <PublishedFormShell key={item.title}>
                  <div className="flex gap-4">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${item.bg}`}>{item.icon}</div>
                    <div>
                      <h3 className="font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.text}</p>
                    </div>
                  </div>
                </PublishedFormShell>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
