import type { Metadata } from "next";
import { MessageSquare, Users } from "lucide-react";
import { PublishedCard, PublishedHero, PublishedSectionHeading } from "@/components/marketing/PublishedSiteSections";
import { getCommunityOverview } from "./data";

export const metadata: Metadata = {
  title: "Communauté | KORYXA",
  description: "Un réseau professionnel de haute qualité pour discuter IA, data, carrières et cas d'usage métier.",
};

export default async function CommunityPage() {
  const overview = await getCommunityOverview();
  const groups = overview.groups.slice(0, 6);
  const posts = overview.posts.slice(0, 3);

  return (
    <main>
      <PublishedHero
        title="Communauté IA KORYXA"
        description="Un réseau professionnel de haute qualité pour discuter IA, data, carrières et cas d'usage métier."
        actions={[{ href: "/community/messages", label: "Rejoindre la communauté" }]}
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading
            title="Groupes thématiques"
            description="Échangez avec des professionnels passionnés dans des espaces dédiés"
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <PublishedCard
                key={group.id}
                title={group.name}
                description={group.description || "Groupe métier KORYXA"}
                footer={
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{(group.members_count || 0).toLocaleString()} membres</span>
                    <span className="inline-flex items-center gap-2"><MessageSquare className="h-4 w-4" />{(group.posts_count || 0).toLocaleString()} posts</span>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading
            title="Discussions visibles"
            description="La communauté ne sert pas à faire joli: elle aide à clarifier, progresser et activer des profils crédibles."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{post.group_name || "Communauté"}</p>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">{post.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{post.body}</p>
                <p className="mt-5 text-sm font-medium text-sky-700">{post.author_name || "Équipe KORYXA"}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
