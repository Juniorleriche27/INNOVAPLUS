import Link from "next/link";
import { INNOVA_API_BASE } from "@/lib/env";

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
    const response = await fetch(`${INNOVA_API_BASE}/products/public`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return { products: [], error: "Impossible de charger les produits." };
    }
    const data = await response.json();
    return {
      products: Array.isArray(data?.items) ? data.items : [],
      error: null,
    };
  } catch {
    return { products: [], error: "Impossible de charger les produits." };
  }
}

export default async function ProductsLanding() {
  const { products, error } = await getPublicProducts();

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                Produits KORYXA
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                Outils de structuration et d'exécution
              </span>
            </div>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Les outils visibles de l'écosystème KORYXA.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              KORYXA ne se limite pas à une page marketing. L'écosystème inclut déjà des outils concrets pour piloter
              l'action, suivre la progression et mieux structurer l'exécution.
            </p>
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
                className="rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_24px_52px_rgba(14,165,233,0.12)] sm:p-8"
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
                      <span
                        key={bullet}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        {bullet}
                      </span>
                    ))}
                  </div>
                </Link>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={product.href} className="btn-primary">
                    {product.cta}
                  </Link>
                  <Link href="/about" className="btn-secondary">
                    Comprendre KORYXA
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
      </div>
    </main>
  );
}
