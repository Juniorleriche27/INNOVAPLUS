export type PlanTier = "free" | "pro" | "team";

export type MenuGroup = "views" | "actions";

export type MyPlanningFeatureId =
  | "dashboard"
  | "weekly"
  | "matrix"
  | "stats"
  | "create"
  | "manage"
  | "coaching"
  | "templates"
  | "automations"
  | "settings";

export type MyPlanningMenuItem = {
  id: MyPlanningFeatureId;
  label: string;
  icon?: string;
  group: MenuGroup;
  minPlan: PlanTier;
  beta?: boolean;
};

export const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  team: 2,
};

export function hasPlanAccess(currentPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan];
}

function normalizeForcedPlan(value: string | undefined): PlanTier | null {
  const plan = String(value || "").trim().toLowerCase();
  if (plan === "free" || plan === "pro" || plan === "team") return plan;
  return null;
}

export const FORCED_PLAN = normalizeForcedPlan(process.env.NEXT_PUBLIC_FORCE_PLAN);

export function inferUserPlan(input?: { plan?: string; roles?: string[] } | null): PlanTier {
  if (FORCED_PLAN) return FORCED_PLAN;

  const plan = String(input?.plan || "").toLowerCase();
  if (plan === "free" || plan === "pro" || plan === "team") return plan;

  const roles = new Set((input?.roles || []).map((role) => String(role).toLowerCase()));
  if (roles.has("admin") || roles.has("myplanning_team") || roles.has("team")) return "team";
  if (roles.has("myplanning_pro") || roles.has("pro")) return "pro";
  return "free";
}

export const MYPLANNING_MENU_ITEMS: MyPlanningMenuItem[] = [
  { id: "dashboard", label: "Dashboard quotidien", icon: "📅", group: "views", minPlan: "free" },
  { id: "weekly", label: "Vue hebdomadaire", icon: "🗓️", group: "views", minPlan: "free" },
  { id: "matrix", label: "Matrice temps / tâches", icon: "🪧", group: "views", minPlan: "free" },
  { id: "stats", label: "Stats & graphiques", icon: "📈", group: "views", minPlan: "pro", beta: true },

  { id: "create", label: "Nouvelle tâche", icon: "➕", group: "actions", minPlan: "free" },
  { id: "manage", label: "Gérer les tâches", icon: "📋", group: "actions", minPlan: "free" },
  { id: "coaching", label: "Coaching IA", icon: "🤖", group: "actions", minPlan: "pro", beta: true },
  { id: "templates", label: "Templates universels", icon: "📐", group: "actions", minPlan: "pro", beta: true },
  { id: "automations", label: "Automatisations", icon: "⚡", group: "actions", minPlan: "pro", beta: true },
  { id: "settings", label: "Paramètres IA", icon: "⚙️", group: "actions", minPlan: "pro" },
];

export const MYPLANNING_FEATURE_MAP: Record<MyPlanningFeatureId, MyPlanningMenuItem> = MYPLANNING_MENU_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<MyPlanningFeatureId, MyPlanningMenuItem>
);

export const MYPLANNING_VIEW_ITEMS = MYPLANNING_MENU_ITEMS.filter((item) => item.group === "views");
export const MYPLANNING_ACTION_ITEMS = MYPLANNING_MENU_ITEMS.filter((item) => item.group === "actions");

export function lockedBadgeLabel(requiredPlan: PlanTier, isBeta = false): string {
  if (requiredPlan === "team") return "🔒 TEAM";
  if (isBeta) return "🔒 PRO BETA";
  return "🔒 PRO";
}
