import type { Metadata } from "next";
import Link from "next/link";
import { INNOVA_API_BASE } from "@/lib/env";

export const metadata: Metadata = {
  title: "Produits | KORYXA",
  description:
    "Découvrez les produits de l'écosystème KORYXA pour l'exécution, le copilote conversationnel, la santé IA et les expériences verticales.",
  openGraph: {
    title: "Produits | KORYXA",
    description:
      "Découvrez les produits de l'écosystème KORYXA pour l'exécution, le copilote conversationnel, la santé IA et les expériences verticales.",
    url: "/products",
  },
};

type PublicProduct = {
  slug: string;
  name: string;
  href: string;
  eyebrow: string;
  summary: string;
  bullets: string[];
  cta: string;
};

async function getPublicProducts(): Promise<{ products: PublicProduct[]; error: string | null }> {
  try {
    const response = await fetch(`${INNOVA_API_BASE}/products/public`, { cache: "no-store" });
    if (!response.ok) {
      return { products: [], error: "Impossible de charger les produits." };
    }
    const data = await response.json();
    return { products: Array.isArray(data?.items) ? data.items : [], error: null };
  } catch {
    return { products: [], error: "Impossible de charger les produits." };
  }
}

export default async function ProductsLanding() {
  const { products, error } = await getPublicProducts();

  return (
    <main className="grid gap-8">
      <section className="relative overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,247,255,0.98))] px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="absolute inset-y-0 right-0 w-[35%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_62%)]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                Produits KORYXA
              </span>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                exécution • copilotes • verticales
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                Les modules opérationnels qui prolongent l'écosystème KORYXA.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                KORYXA n'est pas limité à une promesse marketing. L'écosystème comprend des produits et verticales
                activables pour l'exécution, l'accompagnement, les copilotes et certaines spécialisations sectorielles.
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Logique portefeuille</p>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                KORYXA reste la couche métier visible et oriente vers le bon produit.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                Chaque produit a sa fiche, sa logique d'usage et son CTA propre.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                Les produits doivent prolonger la valeur, pas brouiller la marque KORYXA.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {error ? (
          <div className="rounded-[30px] border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700 lg:col-span-2">
            {error}
          </div>
        ) : products.length ? (
          products.map((product) => (
            <article
              key={product.slug}
              className="rounded-[32px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_24px_52px_rgba(14,165,233,0.12)] sm:p-8"
            >
              <Link
                href={product.href}
                className="group block rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{product.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 transition group-hover:text-sky-700">
                  {product.name}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">{product.summary}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.bullets.map((bullet) => (
                    <span key={bullet} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {bullet}
                    </span>
                  ))}
                </div>
              </Link>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={product.href} className="btn-primary">
                  {product.cta}
                </Link>
                <Link href={`/contact?product=${encodeURIComponent(product.slug)}`} className="btn-secondary">
                  Parler à l'équipe
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[30px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600 lg:col-span-2">
            Aucun produit public n'est disponible pour le moment.
          </div>
        )}
      </section>
    </main>
  );
}
