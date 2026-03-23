import type { Metadata } from "next";
import Link from "next/link";
import CommentComposer from "../../_components/CommentComposer";
import { getCommunityComments, getCommunityPost } from "../../data";

type Props = {
  params: { postId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getCommunityPost(params.postId);
  return {
    title: `${post?.title || "Discussion"} | Réseau IA | KORYXA`,
    description: post?.body || "Discussion du réseau IA KORYXA.",
  };
}

export default async function CommunityPostPage({ params }: Props) {
  const [post, comments] = await Promise.all([
    getCommunityPost(params.postId),
    getCommunityComments(params.postId),
  ]);

  if (!post) {
    return (
      <main className="grid gap-6">
        <section className="rounded-[34px] border border-rose-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">Discussion indisponible</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Cette publication n’est pas disponible.</h1>
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
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                Discussion
              </span>
              {post.group_name ? (
                <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  {post.group_name}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{post.body}</p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Auteur</p>
              <p className="mt-3 text-xl font-semibold text-slate-950">{post.author_name || "Membre du réseau"}</p>
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Commentaires</p>
              <p className="mt-3 text-xl font-semibold text-slate-950">{comments.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
        <article className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Commentaires</p>
          <div className="mt-6 grid gap-3">
            {comments.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
                Aucun commentaire pour le moment.
              </div>
            ) : (
              comments.map((comment) => (
                <article key={comment.id} className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {comment.author_name || "Membre du réseau"}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{comment.body}</p>
                </article>
              ))
            )}
          </div>
        </article>

        <div className="grid gap-4">
          <CommentComposer postId={params.postId} />
          <article className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Suite logique</p>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                Une discussion utile peut déboucher sur une preuve, une orientation, une mission ou un matching plus ciblé.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                Le réseau IA doit rester connecté aux autres briques KORYXA, pas vivre comme un produit isolé.
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/community" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-50">
                Retour au réseau
              </Link>
              <Link href="/community/messages" className="inline-flex rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15">
                Ouvrir les messages
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

