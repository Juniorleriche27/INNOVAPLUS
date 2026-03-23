import type { Metadata } from "next";
import Link from "next/link";
import CommunityComposer from "../../_components/CommunityComposer";
import JoinGroupButton from "../../_components/JoinGroupButton";
import { getCommunityGroup, getCommunityGroupPosts, getCommunityOverview } from "../../data";

type Props = {
  params: { groupId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = await getCommunityGroup(params.groupId);
  return {
    title: `${group?.name || "Groupe"} | Réseau IA | KORYXA`,
    description:
      group?.description || "Découvrez un groupe thématique du réseau IA KORYXA.",
  };
}

export default async function CommunityGroupPage({ params }: Props) {
  const [group, posts, overview] = await Promise.all([
    getCommunityGroup(params.groupId),
    getCommunityGroupPosts(params.groupId),
    getCommunityOverview(),
  ]);

  if (!group) {
    return (
      <main className="grid gap-6">
        <section className="rounded-[34px] border border-rose-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">Groupe indisponible</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Ce groupe n’est pas disponible.</h1>
          <Link href="/community" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">
            Revenir au réseau
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="grid gap-8">
      <section className="rounded-[38px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(237,247,255,0.98))] px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                Groupe thématique
              </span>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                {group.members_count || 0} membres
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              {group.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              {group.description || "Groupe thématique du réseau IA KORYXA."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <JoinGroupButton groupId={params.groupId} />
              <Link href="/community/messages" className="btn-secondary">
                Ouvrir les messages
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Posts</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{group.posts_count || posts.length}</p>
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Logique</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Ce groupe sert à faire circuler expertise, preuves, standards, questions métier et signaux d’opportunités autour d’un axe précis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CommunityComposer
        groups={overview.groups.map((item) => ({ id: item.id, name: item.name }))}
        defaultGroupId={params.groupId}
      />

      <section className="grid gap-4 lg:grid-cols-[1.06fr_0.94fr]">
        <article className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Discussions du groupe</p>
          <div className="mt-6 grid gap-4">
            {posts.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                Aucune publication pour le moment dans ce groupe.
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {post.author_name || "Membre du réseau"}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{post.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{post.body}</p>
                  <Link href={`/community/posts/${post.id}`} className="mt-5 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800">
                    Voir la discussion
                  </Link>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Membres visibles</p>
          <div className="mt-6 grid gap-3">
            {(group.members && group.members.length > 0 ? group.members : [{ name: "Équipe KORYXA", role: "admin" }]).slice(0, 8).map((member, index) => (
              <div key={`${member.id || member.name}-${index}`} className="rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">{member.name || "Membre"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{member.role || "member"}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

