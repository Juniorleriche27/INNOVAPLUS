import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { productCatalog, productList } from "../data";

type Props = {
  params: { slug: string } | Promise<{ slug: string }>;
};

async function resolveParams(input: Props["params"]): Promise<{ slug: string }> {
  if (typeof (input as Promise<{ slug: string }>).then === "function") {
    return await (input as Promise<{ slug: string }>);
  }
  return input as { slug: string };
}

function getProductBySlug(slug: string) {
  return productCatalog[decodeURIComponent(slug || "").trim().toLowerCase()];
}

export function generateStaticParams() {
  return productList.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await resolveParams(params);
  const product = getProductBySlug(resolvedParams.slug);
  if (!product) {
    return {
      title: "Produit | KORYXA",
      description: "Découvrez les produits de l'écosystème KORYXA.",
    };
  }

  return {
    title: `${product.name} | KORYXA`,
    description: product.summary,
    openGraph: {
      title: `${product.name} | KORYXA`,
      description: product.summary,
      url: `/products/${product.slug}`,
      images: [{ url: product.heroImage, alt: product.name }],
    },
    twitter: {
      title: `${product.name} | KORYXA`,
      description: product.summary,
      images: [product.heroImage],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = await resolveParams(params);
  const product = getProductBySlug(resolvedParams.slug);
  if (!product) return notFound();

  return (
    <main className="grid gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="relative overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(236,246,255,0.98))] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_62%)]" aria-hidden />
          <div className="relative grid gap-6 md:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                  Produit
                </span>
                <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  {product.tagline}
                </span>
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-400">Produit</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">{product.summary}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={product.primaryCta.href} className="btn-primary">
                  {product.primaryCta.label}
                </Link>
                <Link href={`/contact?product=${encodeURIComponent(product.slug)}`} className="btn-secondary">
                  Parler à l'équipe
                </Link>
                {product.secondaryCta ? (
                  <a
                    href={product.secondaryCta.href}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    {product.secondaryCta.label}
                  </a>
                ) : null}
              </div>
              {product.contact ? (
                <p className="mt-4 text-sm text-slate-500">
                  Contact direct :{" "}
                  <a className="font-semibold text-sky-600" href={`mailto:${product.contact}`}>
                    {product.contact}
                  </a>
                </p>
              ) : null}
            </div>

            <div className="relative h-72 overflow-hidden rounded-[30px] border border-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
              <Image
                src={product.heroImage}
                alt={product.name}
                fill
                sizes="(min-width: 768px) 520px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[32px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Pourquoi ce produit existe</p>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                Chaque produit doit prolonger l’orchestration KORYXA sans diluer la marque principale.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                Le bon produit dépend du besoin: exécution, conversation, verticale métier ou activation ciblée.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                Le point d’entrée commercial doit rester lisible, avec un contact clair et une suite d’usage défendable.
              </div>
            </div>
          </article>

          <section className="grid gap-4 rounded-[32px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:grid-cols-3">
            {product.stats.map((stat) => (
              <div key={stat.label} className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </section>
        </section>

        <section className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Adoption</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                Pourquoi les organisations l’adoptent
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Le produit doit être compris comme une réponse opérationnelle précise, pas comme une promesse technique
              vague.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {product.highlights.map((highlight) => (
              <div key={highlight} className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-5 text-sm leading-7 text-slate-700">
                {highlight}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Cas d’usage</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Cas d’usage prioritaires</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {product.useCases.map((useCase) => (
              <div key={useCase} className="rounded-[26px] border border-slate-200 bg-slate-50/90 p-5 text-sm leading-7 text-slate-700">
                {useCase}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Entrée produit",
              text: "Utiliser ce module directement quand le besoin et le contexte sont déjà clairs.",
              href: product.primaryCta.href,
              label: product.primaryCta.label,
            },
            {
              title: "Cadrage KORYXA",
              text: "Revenir vers KORYXA si le besoin doit d’abord être structuré ou relié à un autre flux.",
              href: "/entreprise/demarrer",
              label: "Décrire un besoin",
            },
            {
              title: "Réseau & signaux",
              text: "Activer le réseau IA pour discuter de cas d’usage, des métiers, des preuves et des opportunités.",
              href: "/community",
              label: "Explorer le réseau",
            },
          ].map((entry) => (
            <article
              key={entry.title}
              className="rounded-[28px] border border-slate-200/80 bg-white/94 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{entry.title}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{entry.text}</p>
              <Link href={entry.href} className="mt-5 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800">
                {entry.label}
              </Link>
            </article>
          ))}
        </section>

        <section className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Prêt à démarrer ?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Nous vous accompagnons sur l’intégration technique, la personnalisation des flux, la mise en action des
            équipes et les scénarios pilotes. Le bon point d’entrée dépend du niveau de maturité du besoin et du degré
            d’autonomie attendu.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/contact?product=${encodeURIComponent(product.slug)}`} className="btn-primary">
              Parler à l’équipe
            </Link>
            <Link href="/products" className="btn-secondary">
              Revenir aux produits
            </Link>
            <Link href="/community" className="btn-secondary">
              Voir le réseau IA
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
