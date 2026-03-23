import { AUTH_API_BASE } from "@/lib/env";

export type CommunityGroup = {
  id: string;
  name: string;
  description?: string | null;
  is_public?: boolean;
  members_count?: number;
  posts_count?: number;
  owner?: { id?: string | null; name?: string | null };
  members?: Array<{ id?: string; name?: string | null; role?: string | null }>;
};

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  group_id?: string | null;
  group_name?: string | null;
  author_name?: string | null;
};

export type CommunityComment = {
  id: string;
  body: string;
  author_name?: string | null;
};

const SAMPLE_GROUPS: CommunityGroup[] = [
  {
    id: "sample-data-analyst",
    name: "Data Analyst",
    description: "Dashboards, KPIs, analyse descriptive, lecture métier et storytelling analytique.",
    members_count: 1240,
    posts_count: 86,
    is_public: true,
  },
  {
    id: "sample-data-engineer",
    name: "Data Engineer",
    description: "Pipelines, qualité de données, orchestration, entrepôts et structuration technique.",
    members_count: 820,
    posts_count: 57,
    is_public: true,
  },
  {
    id: "sample-ml",
    name: "ML / IA appliquée",
    description: "Cas d’usage prédictifs, assistants intelligents, évaluation et supervision humaine.",
    members_count: 690,
    posts_count: 49,
    is_public: true,
  },
  {
    id: "sample-enterprise",
    name: "Cas d’usage entreprise",
    description: "Besoins IA concrets, cadrage, automatisation, data et exécution utile.",
    members_count: 540,
    posts_count: 38,
    is_public: true,
  },
];

const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: "sample-post-1",
    title: "Comment transformer un besoin entreprise flou en cas d’usage IA exécutable ?",
    body: "Le bon point de départ n’est pas la technologie. Il faut clarifier objectif, données disponibles, résultat attendu et niveau de supervision.",
    author_name: "Équipe KORYXA",
    group_id: "sample-enterprise",
    group_name: "Cas d’usage entreprise",
  },
  {
    id: "sample-post-2",
    title: "Quels signaux rendent un profil Data Analyst réellement activable ?",
    body: "Dashboards utiles, preuves lisibles, rythme de progression, validation et compréhension métier comptent plus qu’une simple liste d’outils.",
    author_name: "Pôle Trajectoire",
    group_id: "sample-data-analyst",
    group_name: "Data Analyst",
  },
  {
    id: "sample-post-3",
    title: "Automatisation IA légère : où commence réellement la valeur ?",
    body: "Souvent sur des workflows de reporting, de collecte ou de diffusion, pas sur des systèmes trop ambitieux trop tôt.",
    author_name: "Ops IA",
    group_id: "sample-ml",
    group_name: "ML / IA appliquée",
  },
];

const SAMPLE_COMMENTS: CommunityComment[] = [
  {
    id: "sample-comment-1",
    body: "Le cadrage initial évite déjà beaucoup de confusion en delivery.",
    author_name: "Aminata D.",
  },
  {
    id: "sample-comment-2",
    body: "La question des données disponibles devrait toujours arriver avant le choix du modèle.",
    author_name: "Jean-Marc K.",
  },
];

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getCommunityOverview() {
  const [groupsRes, postsRes] = await Promise.all([
    fetchJson<{ data?: CommunityGroup[] }>(`${AUTH_API_BASE}/api/groups/`),
    fetchJson<{ data?: CommunityPost[] }>(`${AUTH_API_BASE}/api/posts?page=1`),
  ]);

  return {
    groups: groupsRes?.data?.length ? groupsRes.data : SAMPLE_GROUPS,
    posts: postsRes?.data?.length ? postsRes.data : SAMPLE_POSTS,
  };
}

export async function getCommunityGroup(groupId: string): Promise<CommunityGroup | null> {
  if (groupId.startsWith("sample-")) {
    return SAMPLE_GROUPS.find((group) => group.id === groupId) || null;
  }
  return fetchJson<CommunityGroup>(`${AUTH_API_BASE}/api/groups/${encodeURIComponent(groupId)}`);
}

export async function getCommunityGroupPosts(groupId: string): Promise<CommunityPost[]> {
  if (groupId.startsWith("sample-")) {
    return SAMPLE_POSTS.filter((post) => post.group_id === groupId);
  }
  const postsRes = await fetchJson<{ data?: CommunityPost[] }>(
    `${AUTH_API_BASE}/api/posts?page=1&group_id=${encodeURIComponent(groupId)}`,
  );
  return postsRes?.data?.length ? postsRes.data : [];
}

export async function getCommunityPost(postId: string): Promise<CommunityPost | null> {
  if (postId.startsWith("sample-post-")) {
    return SAMPLE_POSTS.find((post) => post.id === postId) || null;
  }
  return fetchJson<CommunityPost>(`${AUTH_API_BASE}/api/posts/${encodeURIComponent(postId)}`);
}

export async function getCommunityComments(postId: string): Promise<CommunityComment[]> {
  if (postId.startsWith("sample-post-")) {
    return SAMPLE_COMMENTS;
  }
  const commentsRes = await fetchJson<{ data?: CommunityComment[] }>(
    `${AUTH_API_BASE}/api/posts/${encodeURIComponent(postId)}/comments?page=1`,
  );
  return commentsRes?.data?.length ? commentsRes.data : [];
}

