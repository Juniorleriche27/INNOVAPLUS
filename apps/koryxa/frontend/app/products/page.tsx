"use client";

import Link from "next/link";
import Image from "next/image";
import { productList } from "./data";

export default function ProductsLanding() {
  return (
    <div className="min-h-screen bg-[#f5f6fb] px-4 py-10 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Portefeuille</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Solutions KORYXA</h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Explorez nos verticales IA prêtes à l'emploi : santé, éducation, marketing, bibliothèque numérique…
            Chaque produit peut être déployé rapidement dans votre organisation.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          {productList.map((product) => (
            <article
              key={product.slug}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
                <Image src={product.heroImage} alt={product.name} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{product.tagline}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{product.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{product.summary}</p>
                </div>
                <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
                  {product.highlights.slice(0, 3).map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-3">
                  <Link
                    href={`/products/${product.slug}`}
                    className="rounded-full bg-sky-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm shadow-sky-500/20 transition hover:bg-sky-700"
                  >
                    Voir le produit
                  </Link>
                  {product.secondaryCta && (
                    <a
                      href={product.secondaryCta.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:border-slate-300"
                    >
                      Docs
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
