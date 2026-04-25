import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { PublishedHero } from "@/components/marketing/PublishedSiteSections";
import { productList } from "./data";

export const metadata: Metadata = {
  title: "Solutions | KORYXA",
  description: "Les solutions activables qui prolongent l’orchestration KORYXA côté exécution, cadrage et progression.",
};

const PRODUCT_PRESENTATION = {
  "service-ia": {
    icon: <Sparkles className="h-8 w-8 text-violet-600" />,
    bg: "bg-violet-100",
  },
} as const;

export default function ProductsPage() {
  return (
    <main>
      <PublishedHero
        title="Solutions KORYXA"
        description="Service IA, le studio KORYXA pour transformer un besoin entreprise en execution concrete."
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-8 md:grid-cols-2">
          {productList.map((product) => {
            const presentation = PRODUCT_PRESENTATION[product.slug as keyof typeof PRODUCT_PRESENTATION];

            return (
              <article key={product.slug} className="rounded-[30px] border border-slate-200/80 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${presentation?.bg ?? "bg-slate-100"}`}>
                  {presentation?.icon ?? <BookOpen className="h-8 w-8 text-slate-600" />}
                </div>
                <h2 className="text-2xl font-bold text-slate-950">{product.name}</h2>
                <p className="mt-2 text-sm font-semibold text-sky-600">{product.tagline}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">{product.summary}</p>
                <ul className="mt-6 space-y-2">
                  {product.highlights.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={product.primaryCta.href}
                    className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    {product.primaryCta.label}
                  </Link>
                  <Link
                    href={`/produits/${product.slug}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                  >
                    Voir la fiche
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
