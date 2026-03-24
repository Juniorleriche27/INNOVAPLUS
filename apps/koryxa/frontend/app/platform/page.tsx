import Link from "next/link";
import { Bell, Bot, BriefcaseBusiness, FolderKanban, MessageSquare, Target, Users } from "lucide-react";

const QUICK_ACCESS = [
  { icon: Target, label: "Trajectoire", href: "/platform/trajectoire", color: "bg-sky-100 text-sky-600" },
  { icon: BriefcaseBusiness, label: "Entreprise", href: "/platform/entreprise", color: "bg-emerald-100 text-emerald-600" },
  { icon: Bot, label: "ChatLAYA", href: "/platform/chatlaya", color: "bg-amber-100 text-amber-600" },
  { icon: BriefcaseBusiness, label: "Opportunités", href: "/platform/opportunites", color: "bg-rose-100 text-rose-600" },
  { icon: FolderKanban, label: "Missions", href: "/platform/missions", color: "bg-slate-100 text-slate-600" },
  { icon: Users, label: "Communauté", href: "/platform/communaute", color: "bg-sky-100 text-sky-600" },
];

const RECENT_ACTIVITY = [
  { message: "Nouvelle preuve validée par votre formateur", time: "Il y a 2h" },
  { message: "Nouvelle opportunité correspond à votre profil", time: "Il y a 5h" },
  { message: "3 nouveaux commentaires sur votre post", time: "Hier" },
];

export default function PlatformHomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-8 text-white">
        <h1 className="text-3xl font-bold">Bienvenue sur KORYXA</h1>
        <p className="mt-2 text-lg text-slate-300">Votre plateforme d'orchestration IA et de progression de carrière</p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Accès rapide</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACCESS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">{item.label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Trajectoire</h3>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">En cours</span>
          </div>
          <div className="py-4 text-center">
            <div className="text-4xl font-bold text-emerald-600">72%</div>
            <p className="mt-2 text-sm text-slate-500">Score de progression Data Analyst</p>
          </div>
          <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Preuves validées</span><span className="font-semibold">8/12</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Formateur</span><span className="font-semibold">Amadou Diallo</span></div>
          </div>
          <Link href="/platform/trajectoire" className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">
            Voir le cockpit
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Opportunités</h3>
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">3 nouvelles</span>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold">Analyste Data Junior</p>
              <p className="mt-1 text-xs text-slate-500">Tech Startup - Dakar</p>
              <p className="mt-2 text-xs font-semibold text-emerald-600">92% match</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold">Stage Data Analysis</p>
              <p className="mt-1 text-xs text-slate-500">Entreprise IA - Abidjan</p>
              <p className="mt-2 text-xs font-semibold text-sky-600">85% match</p>
            </div>
          </div>
          <Link href="/platform/opportunites" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            Voir toutes les opportunités
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><Bell className="h-5 w-5" />Activité récente</h3>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.message} className="flex gap-3 rounded-xl p-3 hover:bg-slate-50">
                <div className="mt-2 h-2 w-2 rounded-full bg-sky-600" />
                <div>
                  <p className="text-sm font-medium">{item.message}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-6">
        <h3 className="font-semibold text-sky-900">Actions suggérées</h3>
        <div className="mt-4 space-y-3 text-sm text-sky-900">
          <p>Soumettre votre prochaine preuve de progression</p>
          <p>Postuler aux 3 opportunités qui correspondent à votre profil</p>
          <p>Rejoindre le groupe "Data Analyst" pour échanger avec vos pairs</p>
        </div>
      </section>
    </div>
  );
}
