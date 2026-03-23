"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AUTH_API_BASE, INNOVA_API_BASE } from "@/lib/env";
import type { PublicProfile } from "@/lib/api";

type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at?: string | null;
};

function profileLabel(profile: PublicProfile, index: number) {
  const primarySkill = profile.skills?.[0];
  const country = profile.country || "Réseau";
  return primarySkill ? `${primarySkill} • ${country}` : `Talent IA ${index + 1}`;
}

export default function MessagesInboxClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const [contacts, setContacts] = useState<PublicProfile[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState<number>(0);

  const selectedUserId = searchParams.get("user_id") || "";
  const selectedProfile = useMemo(
    () => contacts.find((profile) => profile.user_id === selectedUserId) || null,
    [contacts, selectedUserId],
  );

  useEffect(() => {
    let active = true;
    async function loadContacts() {
      setContactsLoading(true);
      try {
        const response = await fetch(`${INNOVA_API_BASE}/profiles/public?limit=24`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Impossible de charger les profils");
        const data = (await response.json()) as { items?: PublicProfile[] };
        if (!active) return;
        const items = data.items || [];
        setContacts(items);
        if (!selectedUserId && items[0]?.user_id) {
          router.replace(`/community/messages?user_id=${encodeURIComponent(items[0].user_id)}`);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Impossible de charger les contacts.");
      } finally {
        if (active) setContactsLoading(false);
      }
    }
    void loadContacts();
    return () => {
      active = false;
    };
  }, [router, selectedUserId]);

  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    async function loadUnread() {
      try {
        const response = await fetch(`${AUTH_API_BASE}/api/messages/unread_count`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { unread?: number };
        if (!active) return;
        setUnread(data.unread || 0);
      } catch {
        // ignore
      }
    }
    void loadUnread();
    return () => {
      active = false;
    };
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email || !selectedUserId) return;
    let active = true;
    async function loadThread() {
      setMessagesLoading(true);
      setError(null);
      try {
        const response = await fetch(`${AUTH_API_BASE}/api/messages/with/${encodeURIComponent(selectedUserId)}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(text || "Impossible de charger cette conversation.");
        }
        const data = (await response.json()) as DirectMessage[];
        if (!active) return;
        setMessages(data || []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Impossible de charger cette conversation.");
      } finally {
        if (active) setMessagesLoading(false);
      }
    }
    void loadThread();
    return () => {
      active = false;
    };
  }, [selectedUserId, user?.email]);

  async function sendMessage() {
    if (!selectedUserId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_BASE}/api/messages/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: selectedUserId, body: draft.trim() }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Envoi impossible.");
      }
      setDraft("");
      const threadResponse = await fetch(`${AUTH_API_BASE}/api/messages/with/${encodeURIComponent(selectedUserId)}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (threadResponse.ok) {
        const data = (await threadResponse.json()) as DirectMessage[];
        setMessages(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="rounded-[32px] border border-slate-200 bg-white p-6 text-sm text-slate-500">Chargement de la messagerie…</div>;
  }

  if (!user?.email) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Messages</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Connectez-vous pour ouvrir votre messagerie KORYXA</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Les messages directs servent à échanger entre talents, formateurs, équipe KORYXA et capacités activables du réseau.
        </p>
        <Link href="/login?redirect=%2Fcommunity%2Fmessages" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
      <aside className="rounded-[32px] border border-slate-200/80 bg-white/94 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Inbox</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Réseau KORYXA</h2>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {unread} non lu{unread > 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-7 text-slate-600">
          La messagerie relie la communauté, le matching formateur, les discussions métier et certaines activations d’opportunités.
        </div>
        <div className="mt-5 grid gap-3">
          {contactsLoading ? (
            <div className="text-sm text-slate-500">Chargement des contacts…</div>
          ) : contacts.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
              Aucun contact exploitable pour le moment.
            </div>
          ) : (
            contacts.map((profile, index) => {
              const active = selectedUserId === profile.user_id;
              return (
                <button
                  key={profile.user_id}
                  type="button"
                  onClick={() => router.replace(`/community/messages?user_id=${encodeURIComponent(profile.user_id)}`)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-sky-200 bg-sky-50/90 shadow-[0_14px_28px_rgba(14,165,233,0.1)]"
                      : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-950">{profileLabel(profile, index)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(profile.skills || []).slice(0, 3).join(" • ") || "Profil réseau"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {profile.country || "Pays ND"} • {profile.remote ? "Remote" : "Local"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="rounded-[32px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Conversation active</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              {selectedProfile ? profileLabel(selectedProfile, contacts.findIndex((profile) => profile.user_id === selectedProfile.user_id)) : "Choisissez un contact"}
            </h2>
          </div>
          <Link href="/community" className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
            Retour au réseau
          </Link>
        </div>

        <div className="mt-5 min-h-[360px] rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
          {messagesLoading ? (
            <p className="text-sm text-slate-500">Chargement de la conversation…</p>
          ) : selectedUserId ? (
            <div className="grid gap-3">
              {messages.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                  Aucun message pour le moment. Commencez la discussion.
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_id === user.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-[24px] px-4 py-3 text-sm leading-7 ${
                          mine
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {message.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
              Sélectionnez un contact dans la colonne de gauche.
            </div>
          )}
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="mt-4 flex gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Envoyer un message direct dans le réseau KORYXA"
            className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || !selectedUserId}
            className="self-end rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {sending ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </section>
    </div>
  );
}

