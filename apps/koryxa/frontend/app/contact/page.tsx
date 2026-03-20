import type { Metadata } from "next";
import Link from "next/link";
import { productCatalog } from "@/app/products/data";

const DEFAULT_CONTACT_EMAIL = "support@innovaplus.africa";

type SearchParams = Record<string, string | string[] | undefined>;
type SearchParamsInput = SearchParams | Promise<SearchParams>;

function one(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const metadata: Metadata = {
  title: "Contact | KORYXA",
  description:
    "Contactez l'équipe KORYXA pour une démo, un cadrage produit, une intégration ou un accompagnement.",
  openGraph: {
    title: "Contact | KORYXA",
    description:
      "Contactez l'équipe KORYXA pour une démo, un cadrage produit, une intégration ou un accompagnement.",
    url: "/contact",
  },
  twitter: {
    title: "Contact | KORYXA",
    description:
      "Contactez l'équipe KORYXA pour une démo, un cadrage produit, une intégration ou un accompagnement.",
  },
};

async function resolveSearchParams(input?: SearchParamsInput): Promise<SearchParams | undefined> {
  if (!input) return undefined;
  if (typeof (input as Promise<SearchParams>).then === "function") {
    return await (input as Promise<SearchParams>);
  }
  return input as SearchParams;
}

export default async function ContactPage({ searchParams }: { searchParams?: SearchParamsInput }) {
  const params = await resolveSearchParams(searchParams);
  const productSlug = (one(params?.product) || "").trim();
  const requestedSubject = (one(params?.subject) || "").trim();
  const product = productCatalog[productSlug];

  const contactEmail = product?.contact || DEFAULT_CONTACT_EMAIL;
  const subject = requestedSubject || (product ? `Demande produit - ${product.name}` : "Demande KORYXA");
  const mailtoHref = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subject)}`;

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                Contact KORYXA
              </span>
              {product ? (
                <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  {product.name}
                </span>
              ) : null}
            </div>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Parlons du bon point d'entrée.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {product
                ? `${product.name} a déjà une fiche produit. Si vous voulez une démo, un échange commercial ou un cadrage plus précis, utilisez le contact direct ci-dessous.`
                : "Si vous voulez une démo, un échange commercial ou un cadrage produit, utilisez le contact direct ci-dessous."}
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Contact direct</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{contactEmail}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Objet proposé : <span className="font-semibold text-slate-900">{subject}</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={mailtoHref} className="btn-primary">
                Écrire à l'équipe
              </a>
              <Link href={product ? `/products/${product.slug}` : "/products"} className="btn-secondary">
                {product ? "Revenir à la fiche produit" : "Voir les produits"}
              </Link>
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Ce qu'il faut envoyer</p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                Votre objectif principal ou votre cas d'usage.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                Le produit visé, si vous l'avez déjà identifié.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                Le type d'échange attendu : démo, cadrage, intégration ou accompagnement.
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
