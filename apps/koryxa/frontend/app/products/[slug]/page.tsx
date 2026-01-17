"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { productCatalog } from "../data";

type Props = {
  params: { slug: string };
};

export default function ProductDetailPage({ params }: Props) {
  const product = productCatalog[params.slug];
  if (!product) return notFound();

  return (
    <div className="min-h-screen bg-[#f5f6fb] px-4 py-10 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="grid gap-6 rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-sm md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Produit</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">{product.name}</h1>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">{product.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={product.primaryCta.href}
                className="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700"
              >
                {product.primaryCta.label}
              </Link>
              {product.secondaryCta && (
                <a
                  href={product.secondaryCta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  {product.secondaryCta.label}
                </a>
              )}
            </div>
            {product.contact && (
              <p className="mt-4 text-sm text-slate-500">
                Contact direct :{" "}
                <a className="font-semibold text-sky-600" href={`mailto:${product.contact}`}>
                  {product.contact}
                </a>
              </p>
            )}
          </div>
          <div className="relative h-64 overflow-hidden rounded-[28px]">
            <Image src={product.heroImage} alt={product.name} fill sizes="(min-width: 768px) 520px, 100vw" className="object-cover" />
          </div>
        </header>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
          {product.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pourquoi les organisations l’adoptent</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {product.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Cas d’usage prioritaires</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {product.useCases.map((useCase) => (
              <div key={useCase} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                {useCase}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Prêt à démarrer ?</h2>
          <p className="mt-3 text-sm text-slate-600">
            Nous vous accompagnons sur l’intégration technique, la personnalisation des prompts, la formation des équipes
            locales et les scénarios pilotes. Réservez un créneau avec l’équipe produit pour accélérer votre déploiement.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/contact?subject=demo-product"
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Parler à l’équipe
            </Link>
            <Link
              href="/marketplace"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              Voir les offres associées
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
