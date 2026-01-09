import Link from "next/link";

export default function ValidationsPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Projets & validations</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Validation des parcours</h1>
      <p className="mt-3 text-sm text-slate-600">
        Chaque module valide debloque le suivant. Une fois le parcours termine, vous obtenez un badge interne
        “Parcours complete”. Pas d’examens lourds ni de classement public.
      </p>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Projet de synthese</p>
        <p className="mt-2">
          Le projet final met en pratique l’ensemble des modules. KORYXA valide les livrables avant la certification.
        </p>
      </div>
      <Link href="/school/fondamentaux" className="btn-secondary mt-6 inline-flex">
        Retour aux fondamentaux
      </Link>
    </section>
  );
}
