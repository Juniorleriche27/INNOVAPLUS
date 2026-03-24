import type { Metadata } from "next";
import { MessageSquare, Users } from "lucide-react";
import { PublishedCard, PublishedHero, PublishedSectionHeading } from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "Communauté | KORYXA",
  description: "Un réseau professionnel de haute qualité pour discuter IA, data, carrières et cas d'usage métier.",
};

const GROUPS = [
  { name: "Data Analyst", members: 1247, posts: 3421 },
  { name: "Data Engineer", members: 892, posts: 2156 },
  { name: "ML / IA appliquée", members: 1543, posts: 4287 },
  { name: "Cas d'usage entreprise", members: 2134, posts: 5643 },
  { name: "Automatisation & Ops IA", members: 756, posts: 1834 },
  { name: "Chatbots & assistants", members: 1089, posts: 2467 },
];

export default function CommunityPage() {
  return (
    <main>
      <PublishedHero
        title="Communauté IA KORYXA"
        description="Un réseau professionnel de haute qualité pour discuter IA, data, carrières et cas d'usage métier."
        actions={[{ href: "/platform/communaute", label: "Rejoindre la communauté" }]}
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading
            title="Groupes thématiques"
            description="Échangez avec des professionnels passionnés dans des espaces dédiés"
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {GROUPS.map((group) => (
              <PublishedCard
                key={group.name}
                title={group.name}
                description={`${group.members.toLocaleString()} membres • ${group.posts.toLocaleString()} posts`}
                footer={
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{group.members.toLocaleString()} membres</span>
                    <span className="inline-flex items-center gap-2"><MessageSquare className="h-4 w-4" />{group.posts.toLocaleString()} posts</span>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
