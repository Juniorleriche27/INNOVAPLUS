import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpen, CheckCircle2, Sparkles } from "lucide-react";
import { productCatalog, removedProductSlugs, resolveProductSlug } from "../data";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const PRODUCT_ICONS = {
  "service-ia": <Sparkles className="h-8 w-8 text-white" />,
} as const;

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = productCatalog[resolveProductSlug(slug)];
  return {
    title: `${product?.name ?? slug} | KORYXA`,
    description: product?.summary ?? "Produit KORYXA",
  };
}

export default async function ProductPage(props: ProductPageProps) {
  const { slug } = await props.params;
  if (removedProductSlugs.has(slug)) {
    redirect("/produits");
  }
  const product = productCatalog[resolveProductSlug(slug)];

  if (!product) {
    notFound();
  }

  const productIcon = PRODUCT_ICONS[product.slug as keyof typeof PRODUCT_ICONS] ?? <BookOpen className="h-8 w-8 text-white" />;

  return (
    <main>
      <section className="relative w-full bg-[linear-gradient(135deg,#0d8fda_0%,#0d6aa8_100%)] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-[var(--marketing-max-w)] px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 sm:h-16 sm:w-16">{productIcon}</div>
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">{product.name}</h1>
              <p className="mt-2 text-base text-sky-100 sm:text-lg">{product.tagline}</p>
            </div>
          </div>
          <p className="max-w-3xl text-base text-sky-100 sm:text-xl">{product.summary}</p>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">Fonctionnalités principales</h2>
            <div className="mt-6 space-y-4">
              {product.highlights.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
                  <p className="text-lg text-slate-700">{feature}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {product.stats.map((stat) => (
                <article key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-950">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </article>
              ))}
            </div>
          </div>
          <article className="rounded-[30px] border border-slate-200/80 bg-slate-50 p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <h3 className="text-xl font-bold text-slate-950">Commencer avec {product.name}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {product.useCases[0] || "Découvrez comment ce produit peut transformer votre façon de travailler."}
            </p>
            <Link href={product.primaryCta.href} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
              {product.primaryCta.label}
            </Link>
            {product.secondaryCta ? (
              <Link href={product.secondaryCta.href} className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700">
                {product.secondaryCta.label}
              </Link>
            ) : null}
            {product.contact ? <p className="mt-4 text-sm text-slate-500">Contact: {product.contact}</p> : null}
          </article>
        </div>
      </section>
    </main>
  );
}
