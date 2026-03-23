import type { Metadata } from "next";
import MessagesInboxClient from "../_components/MessagesInboxClient";

export const metadata: Metadata = {
  title: "Messages | Réseau IA | KORYXA",
  description:
    "Messagerie directe du réseau IA KORYXA entre talents, formateurs, équipe KORYXA et capacités activables.",
};

export default function CommunityMessagesPage() {
  return (
    <main className="grid gap-6">
      <section className="rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(237,247,255,0.98))] px-6 py-8 shadow-[0_24px_72px_rgba(15,23,42,0.08)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
              Messages directs
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              La messagerie qui relie réseau, progression et activation.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Ici, la conversation n’est pas décorative. Elle sert à clarifier, coordonner, suivre des échanges métier
              et connecter talents, formateurs et équipe KORYXA.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              "Messagerie entre profils activables du réseau.",
              "Conversations liées à la progression, à la validation ou à un besoin précis.",
              "Pont naturel entre communauté, opportunités et capacité d’exécution.",
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <MessagesInboxClient />
    </main>
  );
}

