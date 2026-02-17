"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import PaywallModal from "./components/PaywallModal";
import {
  hasPlanAccess,
  inferUserPlan,
  lockedBadgeLabel,
  MyPlanningFeatureId,
  MYPLANNING_ACTION_ITEMS,
  MYPLANNING_FEATURE_MAP,
  MYPLANNING_MENU_ITEMS,
  MYPLANNING_VIEW_ITEMS,
} from "@/config/planFeatures";

// Ensure the base does not contain duplicated /innova/api segments (older envs or caches)
const CLEAN_API_BASE = INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api");
const API_BASE = `${CLEAN_API_BASE}/myplanning`;

type KanbanState = "todo" | "in_progress" | "done";
type AdvancedKanban = "backlog" | "a_faire" | "en_cours" | "termine" | "bloque";
type Priority =
  | "urgent_important"
  | "important_not_urgent"
  | "urgent_not_important"
  | "not_urgent_not_important";
type TaskStatus = "todo" | "done";
type TaskSource = "manual" | "ia";
type PeriodFilter = "all" | "today" | "last7" | "last30";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority_eisenhower: Priority;
  kanban_state: KanbanState;
  high_impact: boolean;
  estimated_duration_minutes?: number | null;
  start_datetime?: string | null;
  due_datetime?: string | null;
  completed_at?: string | null;
  linked_goal?: string | null;
  moscow?: string | null;
  energy_level?: string | null;
  pomodoro_estimated?: number | null;
  pomodoro_done?: number | null;
  comments?: string | null;
  source?: TaskSource | null;
  status?: TaskStatus | null;
  kanban_state_extended?: AdvancedKanban | null;
  assignee_user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DateTimeParts = { date: string; time: string };

type TaskListResponse = {
  items: Task[];
  total?: number;
  has_more?: boolean;
};

type AiDraft = {
  title: string;
  description?: string | null;
  estimated_duration_minutes?: number | null;
  priority_eisenhower?: Priority | null;
  high_impact?: boolean | null;
  category?: string | null;
  due_datetime?: string | null;
};

type OnboardingIntent = "study_learn" | "work_deliver" | "build_project" | "organize_better";
type OnboardingBudget = "30_minutes" | "1_hour" | "2_hours" | "plus_2_hours";
type OnboardingImpactLevel = "élevé" | "moyen";

type OnboardingGeneratedTask = {
  title: string;
  estimated_time: number;
  impact_level: OnboardingImpactLevel;
};

type OnboardingState = {
  user_intent?: OnboardingIntent | null;
  main_goal_mid_term?: string | null;
  daily_focus_hint?: string | null;
  daily_time_budget?: OnboardingBudget | null;
  onboarding_completed: boolean;
  generated_tasks: OnboardingGeneratedTask[];
};

const EMPTY_ONBOARDING_STATE: OnboardingState = {
  user_intent: null,
  main_goal_mid_term: "",
  daily_focus_hint: "",
  daily_time_budget: null,
  onboarding_completed: false,
  generated_tasks: [],
};

const ONBOARDING_INTENT_OPTIONS: Array<{ value: OnboardingIntent; label: string }> = [
  { value: "study_learn", label: "Étudier / apprendre" },
  { value: "work_deliver", label: "Travailler / livrer" },
  { value: "build_project", label: "Construire un projet" },
  { value: "organize_better", label: "Mieux m’organiser" },
];

const ONBOARDING_BUDGET_OPTIONS: Array<{ value: OnboardingBudget; label: string }> = [
  { value: "30_minutes", label: "30 minutes" },
  { value: "1_hour", label: "1 heure" },
  { value: "2_hours", label: "2 heures" },
  { value: "plus_2_hours", label: "+2 heures" },
];

const VIEWS = MYPLANNING_VIEW_ITEMS;
const ACTIONS = MYPLANNING_ACTION_ITEMS;

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent_important: "Urgent & important",
  important_not_urgent: "Important mais pas urgent",
  urgent_not_important: "Urgent moins important",
  not_urgent_not_important: "Ni urgent ni important",
};

const MOSCOW_LABEL: Record<Priority, string> = {
  urgent_important: "must",
  important_not_urgent: "should",
  urgent_not_important: "could",
  not_urgent_not_important: "wont",
};

const SOURCE_LABEL: Record<TaskSource, string> = {
  manual: "Manuel",
  ia: "IA",
};

const SECTION_ROUTE_MAP: Partial<Record<MyPlanningFeatureId, string>> = {
  dashboard: "/myplanning/app",
  stats: "/myplanning/app/pro/stats",
  coaching: "/myplanning/app/pro/coaching",
  templates: "/myplanning/app/pro/templates",
  automations: "/myplanning/app/pro/automations",
};

function hasHour(text: string): boolean {
  return /\b([01]?\d|2[0-3])h/.test(text);
}

function priorityRank(priority: Priority): number {
  switch (priority) {
    case "urgent_important":
      return 0;
    case "important_not_urgent":
      return 1;
    case "urgent_not_important":
      return 2;
    default:
      return 3;
  }
}

type SortableTimeItem = { title: string; start_datetime?: string | null; due_datetime?: string | null };
type SortablePriorityItem = SortableTimeItem & { priority_eisenhower?: Priority | null; high_impact?: boolean | null };

function extractHour(task: SortableTimeItem): number | null {
  const fromDate = (value?: string | null) => {
    if (!value) return null;
    const hasExplicitTime = /T(?!00:00:00)/.test(value);
    const parsed = parseDate(value);
    if (!parsed) return null;
    const minutes = parsed.getHours() * 60 + parsed.getMinutes();
    // Si l'heure est à minuit (valeur par défaut) et qu'on n'a pas de time explicite, on laissera la chance au titre de fournir une heure.
    return hasExplicitTime || minutes !== 0 ? minutes : null;
  };
  const matchTitle = task.title.match(/\b([01]?\d|2[0-3])h/);
  const titleMinutes = matchTitle ? parseInt(matchTitle[1], 10) * 60 : null;
  const dateScore = fromDate(task.start_datetime) ?? fromDate(task.due_datetime);
  if (dateScore !== null) return dateScore;
  if (titleMinutes !== null) return titleMinutes;
  return null;
}

function sortByPriorityThenHour<T extends SortablePriorityItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const pa = priorityRank(a.priority_eisenhower ?? "important_not_urgent");
    const pb = priorityRank(b.priority_eisenhower ?? "important_not_urgent");
    if (pa !== pb) return pa - pb;
    const ha = extractHour(a);
    const hb = extractHour(b);
    if (ha !== null && hb !== null) return ha - hb;
    if (ha !== null) return -1;
    if (hb !== null) return 1;
    const impactA = Boolean(a.high_impact);
    const impactB = Boolean(b.high_impact);
    if (impactA !== impactB) return impactA ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

function formatDisplayTime(task: SortableTimeItem): string | null {
  // 1) Si une heure explicite est dans start/due, l'utiliser.
  const pick = (value?: string | null) => {
    if (!value) return null;
    const parsed = parseDate(value);
    if (!parsed) return null;
    const hasExplicitTime = /T(?!00:00:00)/.test(value);
    if (!hasExplicitTime && parsed.getHours() === 0 && parsed.getMinutes() === 0) return null;
    return timeFormatter.format(parsed);
  };
  const fromDate = pick(task.start_datetime) || pick(task.due_datetime);
  if (fromDate) return fromDate;
  // 2) Sinon, tenter de lire l'heure dans le titre (ex: "Réveil 6h").
  const match = task.title.match(/\b([01]?\d|2[0-3])h/);
  if (match) {
    const hour = match[1].padStart(2, "0");
    return `${hour}:00`;
  }
  return null;
}

function computePriority(title: string, description?: string | null): Priority {
  const txt = `${title} ${description || ""}`.toLowerCase();
  const hour = hasHour(txt);
  const urgentKeywords = ["rendez", "rdv", "réunion", "formation", "cours", "examen", "entretien", "médec", "facture", "payer", "deadline"];
  const importantKeywords = ["projet", "koryxa", "travail", "réviser", "étude", "budget", "finance", "sport", "santé", "dormir", "préparer", "organisation"];

  if (hour && urgentKeywords.some((k) => txt.includes(k))) return "urgent_important";
  if (hour) return "urgent_not_important";
  if (importantKeywords.some((k) => txt.includes(k))) return "important_not_urgent";
  return "not_urgent_not_important";
}

function computeImpact(title: string, description?: string | null): boolean {
  const txt = `${title} ${description || ""}`.toLowerCase();
  const impactKeywords = ["projet", "koryxa", "travail", "réviser", "étude", "formation", "certification", "budget", "finance", "sport", "santé", "préparer", "objectif", "dlci", "d-clic"];
  return impactKeywords.some((k) => txt.includes(k));
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    let message = await response.text();
    try {
      const parsed: unknown = message ? JSON.parse(message) : null;
      if (parsed && typeof parsed === "object") {
        const detail = (parsed as { detail?: unknown; message?: string }).detail;
        if (Array.isArray(detail)) {
          message = detail
            .map((item) => {
              if (typeof item === "object" && item) {
                const entry = item as { msg?: string; message?: string; detail?: string };
                return entry.msg || entry.message || entry.detail || JSON.stringify(entry);
              }
              return String(item);
            })
            .join(" / ");
        } else {
          const entry = parsed as { detail?: string; message?: string };
          message = entry.detail || entry.message || message;
        }
      }
    } catch {}
    throw new Error(message || "Impossible de contacter MyPlanningAI");
  }
  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(date: Date): Date {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((day + 6) % 7));
  return monday;
}

function formatDateInputValue(date: Date): string {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().split("T")[0];
}

function toIsoDate(date: Date): string {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

function splitDateTime(value?: string | null): DateTimeParts {
  if (!value) return { date: "", time: "" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  const [datePart, timePartRaw] = local.toISOString().split("T");
  return { date: datePart, time: timePartRaw.slice(0, 5) };
}

function joinDateTime(datePart: string, timePart: string): string | undefined {
  if (!datePart) return undefined;
  if (!timePart) return datePart;
  const iso = `${datePart}T${timePart}:00`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function friendlyError(message: string): string {
  if (/not found/i.test(message)) return "Aucune donnée disponible pour l'instant.";
  return message;
}

function formatPomodoroEstimate(duration?: number | null): number | undefined {
  if (!duration) return undefined;
  return Math.max(1, Math.ceil(duration / 25));
}

function normalizeTaskPayload(values: Partial<Task>): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...values };
  const optionalStrings = ["category", "description", "comments", "linked_goal", "moscow", "status", "energy_level"];
  for (const key of optionalStrings) {
    if (typeof payload[key] === "string" && (payload[key] as string).trim() === "") {
      delete payload[key];
    }
  }
  if (!payload.due_datetime) delete payload.due_datetime;
  if (!payload.start_datetime) delete payload.start_datetime;
  if (!payload.estimated_duration_minutes) delete payload.estimated_duration_minutes;
  if (!payload.completed_at) delete payload.completed_at;
  if (!payload.source) delete payload.source;
  return payload;
}

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "short" });
const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function MyPlanningClient({
  variant = "product",
  initialSection,
  productDesktopNav = "sidebar",
}: {
  variant?: "product" | "learning";
  initialSection?: string;
  productDesktopNav?: "bottom" | "sidebar";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const plan = useMemo(() => inferUserPlan(user), [user]);
  const initialFeature = useMemo<MyPlanningFeatureId>(
    () => (initialSection && initialSection in MYPLANNING_FEATURE_MAP ? (initialSection as MyPlanningFeatureId) : "dashboard"),
    [initialSection]
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLoadError, setTaskLoadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [activeSection, setActiveSection] = useState<MyPlanningFeatureId>(initialFeature);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [formValues, setFormValues] = useState<Partial<Task>>({ priority_eisenhower: "important_not_urgent", high_impact: false, source: "manual" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | KanbanState>("all");
  const [filterSource, setFilterSource] = useState<"all" | TaskSource>("all");
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>("all");
  const [aiText, setAiText] = useState("");
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [addingDraftIndex, setAddingDraftIndex] = useState<number | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [addedDrafts, setAddedDrafts] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCoachingGuide, setShowCoachingGuide] = useState(true);
  const [aiSummary, setAiSummary] = useState<{ total: number; counts: Record<Priority, number>; highImpact: number } | null>(null);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [advancedTable, setAdvancedTable] = useState(false);
  const [iaSettings, setIaSettings] = useState<{
    autonomy: "low" | "medium" | "high";
    tone: "concise" | "coach" | "strict";
    quietHours: string;
    notifications: boolean;
  }>({ autonomy: "medium", tone: "coach", quietHours: "06:00-22:00", notifications: true });
  const [dueDatePart, setDueDatePart] = useState<string>("");
  const [dueTimePart, setDueTimePart] = useState<string>("");
  const [paywallFeature, setPaywallFeature] = useState<MyPlanningFeatureId | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(variant === "product");
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [editingGeneratedTask, setEditingGeneratedTask] = useState<number | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingState>({ ...EMPTY_ONBOARDING_STATE });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const raw = (new URLSearchParams(window.location.search).get("fullscreen") || "").toLowerCase();
      setIsFullscreen(raw === "1" || raw === "true" || raw === "yes" || raw === "on");
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("myplanning:querychange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("myplanning:querychange", sync);
    };
  }, [pathname]);

  const applyFullscreenParam = (nextFullscreen: boolean) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (nextFullscreen) url.searchParams.set("fullscreen", "1");
    else url.searchParams.delete("fullscreen");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setIsFullscreen(nextFullscreen);
    window.dispatchEvent(new Event("myplanning:querychange"));
  };

  const toggleFullscreen = () => {
    applyFullscreenParam(!isFullscreen);
  };

  const navigateWithFallback = (href: string) => {
    router.push(href);
    if (typeof window === "undefined") return;
    const targetUrl = new URL(href, window.location.origin);
    window.setTimeout(() => {
      const atTarget =
        window.location.pathname === targetUrl.pathname &&
        (targetUrl.search ? window.location.search === targetUrl.search : true);
      if (!atTarget) {
        window.location.assign(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
      }
    }, 250);
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      applyFullscreenParam(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isFullscreen]);

  const loadTasks = async () => {
    setLoading(true);
    setTaskLoadError(null);
    try {
      const PAGE_SIZE = 200;
      let page = 1;
      const aggregated: Task[] = [];
      while (true) {
        const data = await apiFetch<TaskListResponse>(`/tasks?page=${page}&limit=${PAGE_SIZE}`);
        aggregated.push(...(data.items || []));
        const more = data.has_more ?? (data.items?.length || 0) === PAGE_SIZE;
        if (!more || (data.items || []).length === 0) break;
        page += 1;
        if (page > 20) break; // safety guard against infinite loop
      }
      setTasks(aggregated);
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible de charger les tâches";
      setTaskLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  const resolveOnboardingStep = (state: OnboardingState): 1 | 2 | 3 | 4 | 5 | 6 => {
    if (!state.user_intent) return 1;
    if (!state.main_goal_mid_term?.trim()) return 2;
    // daily_focus_hint is optional but step is explicit; store "" when confirmed.
    if (state.daily_focus_hint === undefined || state.daily_focus_hint === null) return 3;
    if (!state.daily_time_budget) return 4;
    if (!state.generated_tasks?.length) return 5;
    return 6;
  };

  const loadOnboardingState = async () => {
    if (variant !== "product") {
      setOnboardingLoading(false);
      return;
    }
    setOnboardingLoading(true);
    setOnboardingError(null);
    try {
      const state = await apiFetch<OnboardingState>("/onboarding");
      setOnboardingData({
        user_intent: state.user_intent ?? null,
        main_goal_mid_term: state.main_goal_mid_term ?? "",
        daily_focus_hint: state.daily_focus_hint ?? "",
        daily_time_budget: state.daily_time_budget ?? null,
        onboarding_completed: Boolean(state.onboarding_completed),
        generated_tasks: state.generated_tasks || [],
      });
      if (!state.onboarding_completed) {
        setOnboardingStep(resolveOnboardingStep(state));
        setLoading(false);
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "";
      if (/not found|404/i.test(rawMessage)) {
        setOnboardingData({ ...EMPTY_ONBOARDING_STATE });
        setOnboardingStep(1);
        setOnboardingError(null);
        setLoading(false);
        return;
      }
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible de charger l’onboarding";
      setOnboardingError(message);
      setLoading(false);
    } finally {
      setOnboardingLoading(false);
    }
  };

  const persistOnboardingState = async (payload: Partial<OnboardingState>) => {
    const next = await apiFetch<OnboardingState>("/onboarding", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setOnboardingData({
      user_intent: next.user_intent ?? null,
      main_goal_mid_term: next.main_goal_mid_term ?? "",
      daily_focus_hint: next.daily_focus_hint ?? "",
      daily_time_budget: next.daily_time_budget ?? null,
      onboarding_completed: Boolean(next.onboarding_completed),
      generated_tasks: next.generated_tasks || [],
    });
    return next;
  };

  useEffect(() => {
    if (variant === "product") {
      void loadOnboardingState();
      return;
    }
    void loadTasks();
  }, [variant]);

  useEffect(() => {
    if (variant === "product" && onboardingData.onboarding_completed) {
      void loadTasks();
    }
  }, [variant, onboardingData.onboarding_completed]);

  function openPaywall(featureId: MyPlanningFeatureId) {
    setPaywallFeature(featureId);
  }

  function closePaywall() {
    setPaywallFeature(null);
  }

  function isFeatureLocked(featureId: MyPlanningFeatureId): boolean {
    const feature = MYPLANNING_FEATURE_MAP[featureId];
    if (!feature) return false;
    return !hasPlanAccess(plan, feature.minPlan);
  }

  function handleSectionClick(sectionId: MyPlanningFeatureId) {
    if (isFeatureLocked(sectionId)) {
      openPaywall(sectionId);
      return;
    }
    setActiveSection(sectionId);
    if (variant === "product" && pathname.startsWith("/myplanning/app")) {
      const targetRoute = SECTION_ROUTE_MAP[sectionId];
      if (targetRoute && targetRoute !== pathname) {
        router.push(targetRoute);
      }
    }
  }

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("myplanning.sidebar") : null;
    if (saved) setIsSidebarCollapsed(saved === "collapsed");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("myplanning.sidebar", isSidebarCollapsed ? "collapsed" : "open");
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hideGuide = window.localStorage.getItem("myplanning.coaching.guide");
      if (hideGuide === "hidden") setShowCoachingGuide(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("myplanning.ia.settings");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setIaSettings((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore invalid
        }
      }
    }
  }, []);

  useEffect(() => {
    // Sync date/time inputs with current due_datetime
    const parts = splitDateTime(formValues.due_datetime);
    setDueDatePart(parts.date);
    setDueTimePart(parts.time);
  }, [formValues.due_datetime]);

  const categories = useMemo(() => {
    const set = new Set(tasks.map((task) => task.category).filter(Boolean) as string[]);
    return Array.from(set);
  }, [tasks]);

  const dayTasks = useMemo(() => {
    return tasks.filter((task) => {
      const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
      return ref ? sameDay(ref, selectedDate) : false;
    });
  }, [tasks, selectedDate]);

  const weeklyTasks = useMemo(() => {
    const base = startOfWeek(selectedDate);
    return Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(base);
      day.setDate(base.getDate() + idx);
      const list = tasks.filter((task) => {
        const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
        return ref ? sameDay(ref, day) : false;
      });
      return { day, list };
    });
  }, [tasks, selectedDate]);

  const dateInputValue = useMemo(() => formatDateInputValue(selectedDate), [selectedDate]);

  const setSelectedDateAndFocus = (next: Date) => {
    setSelectedDate(next);
    setFilterPeriod("today");
  };

  const shiftSelectedDate = (delta: number) => {
    setSelectedDateAndFocus(
      (() => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + delta);
        return next;
      })(),
    );
  };

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const isInPeriod = (task: Task) => {
      if (filterPeriod === "all") return true;
      const ref = parseDate(task.due_datetime) || parseDate(task.start_datetime) || parseDate(task.created_at);
      if (!ref) return true;
      if (filterPeriod === "today") return sameDay(ref, selectedDate);
      const diffDays = (now.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
      if (filterPeriod === "last7") return diffDays <= 7;
      if (filterPeriod === "last30") return diffDays <= 30;
      return true;
    };
    return tasks.filter((task) => {
      if (filterCategory !== "all" && (task.category || "") !== filterCategory) return false;
      if (filterPriority !== "all" && task.priority_eisenhower !== filterPriority) return false;
      if (filterStatus !== "all" && task.kanban_state !== filterStatus) return false;
      if (filterSource !== "all" && (task.source || "manual") !== filterSource) return false;
      if (!isInPeriod(task)) return false;
      return true;
    });
  }, [tasks, filterCategory, filterPriority, filterStatus, filterSource, filterPeriod, selectedDate]);

  const sortedTasks = useMemo(() => {
    const copy = [...filteredTasks];
    const priorityRank: Record<Priority, number> = {
      urgent_important: 0,
      important_not_urgent: 1,
      urgent_not_important: 2,
      not_urgent_not_important: 3,
    };
    copy.sort((a, b) => {
      // 1) Tâches non terminées avant les terminées
      const statusOrder = (t: Task) => (t.kanban_state === "done" ? 1 : 0);
      const statusDiff = statusOrder(a) - statusOrder(b);
      if (statusDiff !== 0) return statusDiff;

      // 2) Chronologique : start_datetime puis due_datetime
      const refA = parseDate(a.start_datetime) || parseDate(a.due_datetime);
      const refB = parseDate(b.start_datetime) || parseDate(b.due_datetime);
      const timeA = refA?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const timeB = refB?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) return timeA - timeB;

      // 3) Priorité Eisenhower
      const prioA = priorityRank[a.priority_eisenhower];
      const prioB = priorityRank[b.priority_eisenhower];
      if (prioA !== prioB) return prioA - prioB;

      // 4) Impact
      if (a.high_impact !== b.high_impact) return a.high_impact ? -1 : 1;

      return a.title.localeCompare(b.title);
    });
    return copy;
  }, [filteredTasks]);

  const managerStats = useMemo(() => {
    const done = filteredTasks.filter((task) => task.kanban_state === "done").length;
    const highImpact = filteredTasks.filter((task) => task.high_impact).length;
    const late = filteredTasks.filter((task) => {
      const due = parseDate(task.due_datetime);
      return due ? due.getTime() < Date.now() && task.kanban_state !== "done" : false;
    }).length;
    return { total: filteredTasks.length, done, highImpact, late };
  }, [filteredTasks]);

  const completionDate = (task: Task): Date | null => parseDate(task.completed_at) || (task.kanban_state === "done" ? parseDate(task.updated_at) : null);

  const statsLast7 = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 6);
    const createdCount = tasks.filter((t) => {
      const created = parseDate(t.created_at);
      return created && created >= start && created <= today;
    }).length;
    const completed = tasks.filter((t) => {
      const doneAt = completionDate(t);
      return t.kanban_state === "done" && doneAt && doneAt >= start && doneAt <= today;
    });
    const doneCount = completed.length;
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      const count = completed.filter((t) => {
        const d = completionDate(t);
        return d ? sameDay(d, day) : false;
      }).length;
      return { label: shortDayFormatter.format(day), count };
    });
    const avgPerDay = Math.round((doneCount / 7) * 10) / 10;
    const completionRate = filteredTasks.length ? Math.round((managerStats.done / filteredTasks.length) * 100) : 0;
    return { createdCount, doneCount, avgPerDay, completionRate, days };
  }, [tasks, filteredTasks.length, managerStats.done]);

  const resetForm = () => {
    setFormValues({ priority_eisenhower: "important_not_urgent", high_impact: false, source: "manual" });
    setDueDatePart("");
    setDueTimePart("");
    setEditingId(null);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!formValues.title) {
      setBanner({ type: "error", message: "Le titre est obligatoire." });
      return;
    }
    const mergedDue = joinDateTime(dueDatePart, dueTimePart) || formValues.due_datetime;
    const payload = normalizeTaskPayload({ ...formValues, due_datetime: mergedDue });
    try {
      if (editingId) {
        const task = await apiFetch<Task>(`/tasks/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setTasks((prev) => prev.map((t) => (t.id === editingId ? task : t)));
        setBanner({ type: "success", message: "Tâche mise à jour." });
      } else {
        const task = await apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) });
        setTasks((prev) => [task, ...prev]);
        setBanner({ type: "success", message: "Tâche créée." });
      }
      resetForm();
      setActiveSection("dashboard");
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible d'enregistrer la tâche";
      setBanner({ type: "error", message });
    }
  };

  const handleStateChange = async (taskId: string, state: KanbanState) => {
    try {
      const task = await apiFetch<Task>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ kanban_state: state }) });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Action impossible";
      setBanner({ type: "error", message });
    }
  };

  const handleAiSuggest = async () => {
    if (!hasPlanAccess(plan, "pro")) {
      openPaywall("coaching");
      return;
    }
    if (!aiText.trim()) return;
    setAiLoading(true);
    setBanner(null);
    setAiSummary(null);
    setAiSummaryError(null);
    setAddedDrafts(new Set());
    try {
      const res = await apiFetch<{ drafts: AiDraft[]; used_fallback?: boolean }>("/ai/suggest-tasks", { method: "POST", body: JSON.stringify({ free_text: aiText }) });
      setAiDrafts(res.drafts);
      if (res.used_fallback) {
        setBanner({ type: "error", message: "IA principale indisponible. Suggestions générées en mode secours (heuristique)." });
      }
      if (!res.drafts || res.drafts.length === 0) {
        setAiSummaryError("L'IA n'a pas généré de tâches. Ajustez votre description et réessayez.");
        return;
      }
      const counts: Record<Priority, number> = {
        urgent_important: 0,
        important_not_urgent: 0,
        urgent_not_important: 0,
        not_urgent_not_important: 0,
      };
      let highImpact = 0;
      res.drafts.forEach((d) => {
        if (d.priority_eisenhower && counts[d.priority_eisenhower] !== undefined) counts[d.priority_eisenhower] += 1;
        if (d.high_impact) highImpact += 1;
      });
      setAiSummary({ total: res.drafts.length, counts, highImpact });
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Échec de l'assistant";
      setBanner({ type: "error", message });
      setAiSummaryError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddDraft = async (draft: AiDraft, index: number) => {
    if (!hasPlanAccess(plan, "pro")) {
      openPaywall("coaching");
      return;
    }
    if (!draft.title) return;
    setAddingDraftIndex(index);
    try {
      const priority = draft.priority_eisenhower || computePriority(draft.title, draft.description);
      const impact = typeof draft.high_impact === "boolean" ? draft.high_impact : computeImpact(draft.title, draft.description);
      const payload = {
        title: draft.title,
        description: draft.description || "",
        comments: draft.description || "",
        priority_eisenhower: priority,
        high_impact: impact,
        estimated_duration_minutes: draft.estimated_duration_minutes || undefined,
        kanban_state: "todo" as KanbanState,
        due_datetime: draft.due_datetime || toIsoDate(selectedDate),
        source: "ia" as TaskSource,
        category: draft.category || undefined,
      };
      const task = await apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) });
      setTasks((prev) => [task, ...prev]);
      setBanner({ type: "success", message: "Tâche ajoutée à votre planning d'aujourd'hui" });
      setAddedDrafts((prev) => new Set([...Array.from(prev), draft.title]));
      void loadTasks();
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible d'ajouter cette tâche";
      setBanner({ type: "error", message });
    } finally {
      setAddingDraftIndex(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmDelete = typeof window === "undefined" ? true : window.confirm("Supprimer cette tâche ?");
    if (!confirmDelete) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setBanner({ type: "success", message: "Tâche supprimée." });
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible de supprimer la tâche";
      setBanner({ type: "error", message });
    }
  };

  const continueIntentStep = async () => {
    if (!onboardingData.user_intent) return;
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      await persistOnboardingState({ user_intent: onboardingData.user_intent });
      setOnboardingStep(2);
    } catch (err) {
      setOnboardingError(err instanceof Error ? friendlyError(err.message) : "Impossible d’enregistrer l’intention.");
    } finally {
      setOnboardingBusy(false);
    }
  };

  const continueGoalStep = async () => {
    const goal = onboardingData.main_goal_mid_term?.trim() || "";
    if (!goal) return;
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      await persistOnboardingState({ main_goal_mid_term: goal });
      setOnboardingStep(3);
    } catch (err) {
      setOnboardingError(err instanceof Error ? friendlyError(err.message) : "Impossible d’enregistrer l’objectif.");
    } finally {
      setOnboardingBusy(false);
    }
  };

  const continueDailyFocusStep = async () => {
    const hint = onboardingData.daily_focus_hint?.trim() || "";
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      await persistOnboardingState({ daily_focus_hint: hint });
      setOnboardingStep(4);
    } catch (err) {
      setOnboardingError(err instanceof Error ? friendlyError(err.message) : "Impossible d’enregistrer le focus du jour.");
    } finally {
      setOnboardingBusy(false);
    }
  };

  const continueBudgetStep = async () => {
    if (!onboardingData.daily_time_budget) return;
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      await persistOnboardingState({ daily_time_budget: onboardingData.daily_time_budget });
      setOnboardingStep(5);
    } catch (err) {
      setOnboardingError(err instanceof Error ? friendlyError(err.message) : "Impossible d’enregistrer le budget temps.");
    } finally {
      setOnboardingBusy(false);
    }
  };

  const generateOnboardingTasks = async () => {
    if (!onboardingData.user_intent || !onboardingData.main_goal_mid_term?.trim() || !onboardingData.daily_time_budget) {
      setOnboardingError("Complète d’abord les étapes précédentes.");
      return;
    }
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      const response = await apiFetch<{ generated_tasks: OnboardingGeneratedTask[] }>("/onboarding/generate", {
        method: "POST",
        body: JSON.stringify({
          user_intent: onboardingData.user_intent,
          main_goal_mid_term: onboardingData.main_goal_mid_term.trim(),
          daily_focus_hint: onboardingData.daily_focus_hint?.trim() || undefined,
          daily_time_budget: onboardingData.daily_time_budget,
        }),
      });
      const generated = response.generated_tasks || [];
      setOnboardingData((prev) => ({ ...prev, generated_tasks: generated }));
      setOnboardingStep(6);
    } catch (err) {
      setOnboardingError(err instanceof Error ? friendlyError(err.message) : "Impossible de générer le planning IA.");
    } finally {
      setOnboardingBusy(false);
    }
  };

  const saveGeneratedTasks = async (nextTasks: OnboardingGeneratedTask[]) => {
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      await persistOnboardingState({ generated_tasks: nextTasks.slice(0, 3) });
      setOnboardingData((prev) => ({ ...prev, generated_tasks: nextTasks.slice(0, 3) }));
    } catch (err) {
      setOnboardingError(err instanceof Error ? friendlyError(err.message) : "Impossible de mettre à jour les tâches.");
    } finally {
      setOnboardingBusy(false);
    }
  };

  const acceptOnboardingPlan = async () => {
    if (!onboardingData.generated_tasks.length) return;
    setOnboardingBusy(true);
    setOnboardingError(null);
    try {
      const response = await apiFetch<{ created_tasks: Task[]; onboarding_completed: boolean }>("/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({ generated_tasks: onboardingData.generated_tasks }),
      });
      const createdTasks = response.created_tasks || [];
      setTasks((prev) => [...createdTasks, ...prev]);
      setOnboardingData((prev) => ({ ...prev, onboarding_completed: Boolean(response.onboarding_completed) }));
      setBanner({
        type: "success",
        message: `${createdTasks.length} tâche(s) ajoutée(s). Ton dashboard est prêt.`,
      });
      setActiveSection("dashboard");
    } catch (err) {
      setOnboardingError(err instanceof Error ? friendlyError(err.message) : "Impossible de finaliser l’onboarding.");
    } finally {
      setOnboardingBusy(false);
    }
  };

  const renderOnboarding = () => {
    const goalLength = (onboardingData.main_goal_mid_term || "").length;
    const dailyHintLength = (onboardingData.daily_focus_hint || "").length;
    return (
      <div className="w-full space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Onboarding MyPlanningAI</p>
          <p className="text-sm text-slate-600">Étape {onboardingStep} / 6</p>
        </div>
        {onboardingError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{onboardingError}</div> : null}

        {onboardingStep === 1 ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">Pourquoi utilises-tu MyPlanningAI aujourd’hui ?</h1>
            <div className="grid gap-2">
              {ONBOARDING_INTENT_OPTIONS.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="onboarding_intent"
                    checked={onboardingData.user_intent === option.value}
                    onChange={() => setOnboardingData((prev) => ({ ...prev, user_intent: option.value }))}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <button
              onClick={continueIntentStep}
              disabled={!onboardingData.user_intent || onboardingBusy}
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        ) : null}

        {onboardingStep === 2 ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">Ton objectif principal en ce moment (1-4 semaines)</h1>
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Ce n’est pas ta tâche du jour. C’est ce que tu veux faire avancer sur les prochaines semaines.
            </p>
            <label className="block text-sm text-slate-700">
              <input
                value={onboardingData.main_goal_mid_term || ""}
                maxLength={120}
                placeholder="Ex : Préparer mon examen de statistiques"
                onChange={(event) => setOnboardingData((prev) => ({ ...prev, main_goal_mid_term: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-slate-500">{goalLength}/120</span>
            </label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              Exemples: Préparer mon examen de statistiques • Lancer mon MVP • Trouver un premier client
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setOnboardingStep(1)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Retour
              </button>
              <button
                onClick={continueGoalStep}
                disabled={!onboardingData.main_goal_mid_term?.trim() || onboardingBusy}
                className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        ) : null}

        {onboardingStep === 3 ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">
              Aujourd’hui, sur quoi dois-tu avancer pour te rapprocher de cet objectif ?
            </h1>
            <label className="block text-sm text-slate-700">
              <input
                value={onboardingData.daily_focus_hint || ""}
                maxLength={120}
                placeholder="Ex : clarifier le livrable, réviser le chapitre 1, écrire la landing"
                onChange={(event) => setOnboardingData((prev) => ({ ...prev, daily_focus_hint: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
              />
              <span className="mt-1 block text-xs text-slate-500">{dailyHintLength}/120 (facultatif)</span>
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => setOnboardingStep(2)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Retour
              </button>
              <button
                onClick={continueDailyFocusStep}
                className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={onboardingBusy}
              >
                Continuer
              </button>
            </div>
          </div>
        ) : null}

        {onboardingStep === 4 ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">Combien de temps peux-tu réellement consacrer par jour ?</h1>
            <div className="grid gap-2 sm:grid-cols-2">
              {ONBOARDING_BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setOnboardingData((prev) => ({ ...prev, daily_time_budget: option.value }))}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    onboardingData.daily_time_budget === option.value ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setOnboardingStep(3)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Retour
              </button>
              <button
                onClick={continueBudgetStep}
                disabled={!onboardingData.daily_time_budget || onboardingBusy}
                className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        ) : null}

        {onboardingStep === 5 ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">
              Voici les 3 actions maximum qui feront avancer ton objectif à long terme, aujourd’hui.
            </h1>
            <p className="text-sm text-slate-600">
              Chaque action doit contribuer directement à ton objectif moyen terme.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setOnboardingStep(4)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Retour
              </button>
              <button
                onClick={generateOnboardingTasks}
                disabled={onboardingBusy}
                className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {onboardingBusy ? "Génération..." : "Continuer"}
              </button>
            </div>
          </div>
        ) : null}

        {onboardingStep === 6 ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">Tu restes maître de ton planning.</h1>
            <div className="space-y-3">
              {onboardingData.generated_tasks.map((task, index) => (
                <div key={`${task.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {editingGeneratedTask === index ? (
                    <div className="space-y-3">
                      <input
                        value={task.title}
                        maxLength={160}
                        onChange={(event) =>
                          setOnboardingData((prev) => ({
                            ...prev,
                            generated_tasks: prev.generated_tasks.map((item, idx) =>
                              idx === index ? { ...item, title: event.target.value } : item
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="number"
                          min={10}
                          max={240}
                          value={task.estimated_time}
                          onChange={(event) =>
                            setOnboardingData((prev) => ({
                              ...prev,
                              generated_tasks: prev.generated_tasks.map((item, idx) =>
                                idx === index ? { ...item, estimated_time: Number(event.target.value) || 10 } : item
                              ),
                            }))
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                        <select
                          value={task.impact_level}
                          onChange={(event) =>
                            setOnboardingData((prev) => ({
                              ...prev,
                              generated_tasks: prev.generated_tasks.map((item, idx) =>
                                idx === index ? { ...item, impact_level: event.target.value as OnboardingImpactLevel } : item
                              ),
                            }))
                          }
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        >
                          <option value="élevé">élevé</option>
                          <option value="moyen">moyen</option>
                        </select>
                      </div>
                      <button
                        onClick={async () => {
                          await saveGeneratedTasks(onboardingData.generated_tasks);
                          setEditingGeneratedTask(null);
                        }}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                      >
                        Enregistrer la modification
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-600">
                        Temps estimé: {task.estimated_time} min • Impact: {task.impact_level}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setEditingGeneratedTask(index)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() =>
                            void saveGeneratedTasks(onboardingData.generated_tasks.filter((_, idx) => idx !== index))
                          }
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                        >
                          ❌ Supprimer une tâche
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={acceptOnboardingPlan}
                disabled={!onboardingData.generated_tasks.length || onboardingBusy}
                className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                ✅ Accepter le planning
              </button>
              <button onClick={() => setOnboardingStep(5)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Regénérer
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderDashboard = () => {
    const emptyDay = dayTasks.length === 0;
    return (
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Tâches actives</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{dayTasks.length}</p>
            <p className="text-xs text-slate-500">Aujourd'hui</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Complétées</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {dayTasks.length ? Math.round((dayTasks.filter((task) => task.kanban_state === "done").length / dayTasks.length) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500">Progression</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Impact élevé</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{dayTasks.filter((task) => task.high_impact).length}</p>
            <p className="text-xs text-slate-500">Pareto 20 %</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Pomodoro estimés</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {dayTasks.reduce((sum, task) => sum + (task.pomodoro_estimated || 0), 0)}
            </p>
            <p className="text-xs text-slate-500">Sessions prévues</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>Planning du jour</span>
            <span>{timeFormatter.format(new Date())}</span>
          </div>
          {emptyDay ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Tu n’as aucune tâche aujourd’hui.</p>
              <p className="mt-1 text-slate-600">Veux-tu organiser ta journée en 2 minutes ?</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button onClick={() => setActiveSection("create")} className="rounded-full bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
                  Créer une nouvelle tâche
                </button>
                <button
                  onClick={() => {
                    if (!hasPlanAccess(plan, "pro")) {
                      openPaywall("coaching");
                      return;
                    }
                    setActiveSection("coaching");
                  }}
                  className="rounded-full border border-sky-200 px-4 py-2 text-sky-700 hover:bg-sky-50"
                >
                  Organiser ma journée avec l’IA
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {sortByPriorityThenHour(dayTasks).map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="grid grid-cols-[1fr,auto] items-start gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span>{task.title}</span>
                        {formatDisplayTime(task) && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{formatDisplayTime(task)}</span>}
                      </p>
                      {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      {task.high_impact && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Impact élevé</span>}
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">{PRIORITY_LABEL[task.priority_eisenhower]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekly = () => {
    const hasTasks = weeklyTasks.some((d) => d.list.length);
    const monday = startOfWeek(selectedDate);
    if (!hasTasks) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Vous n’avez pas encore de tâches pour cette semaine.</p>
          <button
            onClick={() => {
              setSelectedDate(monday);
              if (!hasPlanAccess(plan, "pro")) {
                openPaywall("coaching");
                return;
              }
              setActiveSection("coaching");
            }}
            className="mt-3 rounded-full bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700"
          >
            Organiser ma semaine avec l’IA
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weeklyTasks.map(({ day, list }) => (
            <div
              key={day.toISOString()}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-200 cursor-pointer"
              onClick={() => {
                setSelectedDate(day);
                setActiveSection("dashboard");
              }}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{shortDayFormatter.format(day)} {day.getDate()}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{list.length} tâche(s)</span>
              </div>
              <div className="mt-2 space-y-2">
                {sortByPriorityThenHour(list).slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-800">
                      <p className="font-semibold line-clamp-1">{task.title}</p>
                      <p className="text-[11px] text-slate-500">{PRIORITY_LABEL[task.priority_eisenhower]}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      {task.high_impact && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Impact</span>}
                      {task.kanban_state === "done" ? <span className="text-emerald-600 text-lg">✓</span> : <span className="text-slate-400 text-lg">•</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMatrix = () => {
    const quadrants: Record<Priority, Task[]> = {
      urgent_important: [],
      important_not_urgent: [],
      urgent_not_important: [],
      not_urgent_not_important: [],
    };
    dayTasks.forEach((task) => quadrants[task.priority_eisenhower].push(task));

    const Empty = (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
        <p>Créez ou générez des tâches pour voir votre matrice de priorités.</p>
        <button onClick={() => handleSectionClick("coaching")} className="mt-3 rounded-full border border-sky-200 px-4 py-2 text-sky-700 hover:bg-sky-50">
          Générer des tâches avec l’IA
        </button>
      </div>
    );

    return (
      <div className="space-y-3">
        {!dayTasks.length ? (
          Empty
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(Object.keys(quadrants) as Priority[]).map((prio) => (
              <div key={prio} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{PRIORITY_LABEL[prio]}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{quadrants[prio].length}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {sortByPriorityThenHour(quadrants[prio]).slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                      <span>{task.title}</span>
                      {task.high_impact && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Impact élevé</span>}
                    </div>
                  ))}
                  {quadrants[prio].length > 5 && (
                    <button
                      onClick={() => {
                        setFilterPriority(prio);
                        setActiveSection("manage");
                      }}
                      className="text-xs font-semibold text-sky-700"
                    >
                      Voir toutes les tâches →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStats = () => {
    if (!hasPlanAccess(plan, "pro")) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Pro</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">Stats & graphiques</h2>
          <p className="mt-2 text-sm text-slate-600">Les statistiques avancées sont disponibles en Pro.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/myplanning/pricing?upgrade=pro&feature=stats&message=Fonctionnalit%C3%A9%20Pro%20-%20d%C3%A9bloque%20le%20pilotage%20avanc%C3%A9."
              className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Voir l’offre Pro
            </Link>
            <button
              onClick={() => setActiveSection("dashboard")}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Plus tard
            </button>
          </div>
        </div>
      );
    }
    if (!tasks.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Nous afficherons vos statistiques dès que vous aurez commencé à utiliser votre planning.</p>
          <button onClick={() => setActiveSection("create")} className="mt-3 rounded-full bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
            Créer ma première tâche
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Tâches créées (7 j)</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsLast7.createdCount}</p>
            <p className="text-xs text-slate-500">Total de tâches ajoutées sur les 7 derniers jours.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Tâches complétées (7 j)</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsLast7.doneCount}</p>
            <p className="text-xs text-slate-500">Volume terminé sur 7 jours.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Taux de complétion</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsLast7.completionRate}%</p>
            <p className="text-xs text-slate-500">Tâches terminées / créées (7 j).</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Moyenne / jour (7 j)</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsLast7.avgPerDay}</p>
            <p className="text-xs text-slate-500">Tâches terminées par jour en moyenne.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Complétées sur 7 jours</p>
          <p className="text-xs text-slate-500">Chaque barre = tâches terminées ce jour. Objectif : garder la cadence ou lisser la charge.</p>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {statsLast7.days.map((day) => (
              <div key={day.label} className="flex flex-col items-center gap-2">
                <div className="h-32 w-full rounded-lg bg-slate-100">
                  <div className="h-full w-full rounded-lg bg-sky-500" style={{ height: `${Math.min(day.count * 15, 128)}px` }} />
                </div>
                <span className="text-[11px] text-slate-500">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskTable = () => {
    const Filters = (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select value={filterPeriod} onChange={(event) => setFilterPeriod(event.target.value as PeriodFilter)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes périodes</option>
          <option value="today">Aujourd’hui</option>
          <option value="last7">7 derniers jours</option>
          <option value="last30">30 derniers jours</option>
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as typeof filterStatus)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Tous statuts</option>
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
        </select>
        <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value as typeof filterPriority)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes priorités</option>
          <option value="urgent_important">Urgent & important</option>
          <option value="important_not_urgent">Important mais pas urgent</option>
          <option value="urgent_not_important">Urgent moins important</option>
          <option value="not_urgent_not_important">Ni urgent ni important</option>
        </select>
        <select value={filterSource} onChange={(event) => setFilterSource(event.target.value as typeof filterSource)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes origines</option>
          <option value="manual">Créées manuellement</option>
          <option value="ia">Générées par l’IA</option>
        </select>
        <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes catégories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button onClick={() => void loadTasks()} className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-600">
          Recharger
        </button>
      </div>
    );

    if (loading) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Chargement des tâches…</span>
            {Filters}
          </div>
        </div>
      );
    }
    if (taskLoadError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{taskLoadError}</span>
            <button onClick={() => void loadTasks()} className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700">
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    if (!sortedTasks.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center text-sm text-slate-500">
          <div className="flex flex-col gap-2 text-center">
            <p>Aucune tâche pour ce filtre. Créez une nouvelle tâche ou ajustez vos filtres.</p>
            <div className="flex justify-center gap-2 text-xs">{Filters}</div>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{sortedTasks.length} tâches</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{managerStats.done} terminées</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{managerStats.late} en retard</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                setAdvancedTable((v) => {
                  const next = !v;
                  if (next) setShowAdvancedForm(true);
                  return next;
                })
              }
              className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-600"
            >
              {advancedTable ? "Vue simple" : "Vue avancée"}
            </button>
            <button
              onClick={() => setShowAdvancedForm(true)}
              className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-600"
              title="Afficher les champs avancés dans le formulaire"
            >
              Formulaire avancé
            </button>
            {Filters}
          </div>
        </div>
        <div className="max-h-[580px] overflow-auto">
          <table className="min-w-full text-sm text-slate-600">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase text-slate-400 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr>
                <th className="px-4 py-3 text-left">✓</th>
                <th className="px-4 py-3 text-left">Titre</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-center">Priorité</th>
                {advancedTable && <th className="px-4 py-3 text-left">Catégorie</th>}
                {advancedTable && <th className="px-4 py-3 text-left">Objectif</th>}
                {advancedTable && <th className="px-4 py-3 text-left">MoSCoW</th>}
                {advancedTable && <th className="px-4 py-3 text-left">Kanban</th>}
                {advancedTable && <th className="px-4 py-3 text-left">Énergie</th>}
                {advancedTable && <th className="px-4 py-3 text-left">Pomodoro</th>}
                <th className="px-4 py-3 text-center">Impact</th>
                {advancedTable && <th className="px-4 py-3 text-left">Source</th>}
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {sortedTasks.map((task) => {
                  const due = task.due_datetime ? dayFormatter.format(new Date(task.due_datetime)) : "—";
                  const late = parseDate(task.due_datetime)?.getTime() && parseDate(task.due_datetime)!.getTime() < Date.now() && task.kanban_state !== "done";
                  return (
                    <tr key={task.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={task.kanban_state === "done"}
                        onChange={(event) => void handleStateChange(task.id, event.target.checked ? "done" : "todo")}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{task.title}</span>
                        {task.description && <span className="text-[11px] text-slate-500 line-clamp-2">{task.description}</span>}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-xs ${late ? "font-semibold text-amber-600" : "text-slate-500"}`}>{due}</td>
                    <td className="px-4 py-3 text-xs text-center">
                      <span className="inline-flex rounded-full bg-sky-50 px-3 py-0.5 font-medium text-sky-700">{PRIORITY_LABEL[task.priority_eisenhower]}</span>
                    </td>
                    {advancedTable && (
                      <td className="px-4 py-3 text-xs">
                        {task.category ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{task.category}</span> : "—"}
                      </td>
                    )}
                    {advancedTable && <td className="px-4 py-3 text-xs">{task.linked_goal || "—"}</td>}
                    {advancedTable && <td className="px-4 py-3 text-xs">{MOSCOW_LABEL[task.priority_eisenhower]}</td>}
                    {advancedTable && <td className="px-4 py-3 text-xs">{task.kanban_state || task.kanban_state_extended || "—"}</td>}
                    {advancedTable && <td className="px-4 py-3 text-xs">{task.energy_level || "—"}</td>}
                    {advancedTable && (
                      <td className="px-4 py-3 text-xs">
                        {task.pomodoro_estimated || 0} / {task.pomodoro_done || 0}
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-center">
                      <span className={`inline-flex rounded-full px-3 py-0.5 font-semibold ${task.high_impact ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {task.high_impact ? "Oui" : "Non"}
                      </span>
                    </td>
                    {advancedTable && (
                      <td className="px-4 py-3 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{SOURCE_LABEL[(task.source as TaskSource) || "manual"]}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                      <select
                        value={task.kanban_state}
                        onChange={(event) => void handleStateChange(task.id, event.target.value as KanbanState)}
                        className="rounded-full border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value="todo">À faire</option>
                        <option value="in_progress">En cours</option>
                        <option value="done">Terminé</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(task.id);
                            setFormValues({ ...task, source: (task.source as TaskSource) || "manual" });
                            setActiveSection("create");
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-sky-200 hover:text-sky-700"
                        >
                          Éditer
                        </button>
                        {task.kanban_state === "done" ? (
                          <>
                            <span className="inline-flex items-center rounded-full border border-emerald-200 px-3 py-1 text-emerald-700">
                              Terminé ✓
                            </span>
                            <button
                              onClick={() => void handleStateChange(task.id, "todo")}
                              className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-300"
                            >
                              Reprendre
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => void handleStateChange(task.id, "done")}
                            className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:border-emerald-300"
                          >
                            Terminer
                          </button>
                        )}
                        <button
                          onClick={() => void handleDeleteTask(task.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 hover:border-rose-300"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderManage = () => (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{managerStats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <p className="text-xs uppercase text-emerald-700">Terminées</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{managerStats.done}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <p className="text-xs uppercase text-amber-700">En retard</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{managerStats.late}</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
          <p className="text-xs uppercase text-sky-700">Impact élevé</p>
          <p className="mt-1 text-2xl font-semibold text-sky-800">{managerStats.highImpact}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setActiveSection("create")} className="rounded-full bg-sky-600 px-4 py-2 font-semibold text-white shadow hover:bg-sky-700">
            + Nouvelle tâche
          </button>
          <button onClick={() => void loadTasks()} className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 hover:border-sky-200 hover:text-sky-700">
            Rafraîchir la liste
          </button>
        </div>
        <p className="text-xs text-slate-500">Vue tableau — optimisée pour la saisie rapide</p>
      </div>
      {renderTaskTable()}
    </div>
  );

  const renderCreateForm = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{editingId ? "Modifier la tâche" : "Nouvelle tâche"}</h2>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={submitForm}>
        <label className="text-sm text-slate-600">
          Titre
          <input
            required
            value={formValues.title || ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600">
          Catégorie
          <input
            value={formValues.category || ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, category: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600">
          Priorité (Eisenhower)
          <select
            value={formValues.priority_eisenhower || "important_not_urgent"}
            onChange={(event) => setFormValues((prev) => ({ ...prev, priority_eisenhower: event.target.value as Priority }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="urgent_important">Urgent & important</option>
            <option value="important_not_urgent">Important mais pas urgent</option>
            <option value="urgent_not_important">Urgent moins important</option>
            <option value="not_urgent_not_important">Ni urgent ni important</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Impact élevé
          <select
            value={formValues.high_impact ? "oui" : "non"}
            onChange={(event) => setFormValues((prev) => ({ ...prev, high_impact: event.target.value === "oui" }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Durée estimée (min)
          <input
            type="number"
            min={5}
            value={formValues.estimated_duration_minutes ?? ""}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                estimated_duration_minutes: event.target.value ? Number(event.target.value) : undefined,
                pomodoro_estimated: event.target.value ? formatPomodoroEstimate(Number(event.target.value)) : undefined,
              }))
            }
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            placeholder="Ex : 25, 45, 60"
          />
        </label>
        <label className="text-sm text-slate-600">
          Échéance
          <div className="mt-1 grid grid-cols-[1.1fr,0.9fr] gap-2">
            <input
              type="date"
              value={dueDatePart}
              onChange={(event) => setDueDatePart(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            <input
              type="time"
              value={dueTimePart}
              onChange={(event) => setDueTimePart(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="hh:mm"
            />
          </div>
        </label>
        <label className="text-sm text-slate-600 md:col-span-2">
          Commentaires
          <textarea
            rows={4}
            value={formValues.comments || ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, comments: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="button"
            onClick={() => setShowAdvancedForm((v) => !v)}
            className="text-sm font-semibold text-sky-700 hover:underline"
          >
            {showAdvancedForm ? "Replier les options avancées" : "Afficher plus d’options"}
          </button>
        </div>
        {showAdvancedForm && (
          <div className="md:col-span-2 grid gap-4 md:grid-cols-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <label className="text-sm text-slate-600">
              Objectif lié
              <input
                value={formValues.linked_goal || ""}
                onChange={(event) => setFormValues((prev) => ({ ...prev, linked_goal: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </label>
            <label className="text-sm text-slate-600">
              MoSCoW (auto)
              <input readOnly value={MOSCOW_LABEL[(formValues.priority_eisenhower as Priority) || "important_not_urgent"]} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-600">
              Statut
              <select
                value={formValues.status || "todo"}
                onChange={(e) => setFormValues((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="todo">À faire</option>
                <option value="done">Terminée</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              État Kanban
              <select
                value={(formValues.kanban_state_extended as AdvancedKanban) || "a_faire"}
                onChange={(e) => setFormValues((prev) => ({ ...prev, kanban_state_extended: e.target.value as AdvancedKanban }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="backlog">Backlog</option>
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="bloque">Bloqué</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Niveau d’énergie
              <select
                value={formValues.energy_level || ""}
                onChange={(e) => setFormValues((prev) => ({ ...prev, energy_level: e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">—</option>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Pomodoro estimés
              <input
                type="number"
                min={0}
                value={formValues.pomodoro_estimated ?? ""}
                onChange={(e) => setFormValues((prev) => ({ ...prev, pomodoro_estimated: e.target.value ? Number(e.target.value) : undefined }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">Nombre de blocs de 25 minutes prévus.</p>
            </label>
            <label className="text-sm text-slate-600">
              Pomodoro réalisés
              <input
                type="number"
                min={0}
                value={formValues.pomodoro_done ?? ""}
                onChange={(e) => setFormValues((prev) => ({ ...prev, pomodoro_done: e.target.value ? Number(e.target.value) : undefined }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">Nombre de blocs de 25 minutes réalisés.</p>
            </label>
            <label className="text-sm text-slate-600">
              Responsable
              <select
                value={formValues.assignee_user_id || "me"}
                onChange={(e) => setFormValues((prev) => ({ ...prev, assignee_user_id: e.target.value === "me" ? null : e.target.value }))}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="me">Moi</option>
              </select>
            </label>
          </div>
        )}
        <div className="flex gap-3 md:col-span-2">
          <button type="submit" className="rounded-full bg-sky-600 px-4 py-2 font-semibold text-white">
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setActiveSection("dashboard");
            }}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-500"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  const renderCoaching = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="w-full space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-sky-600 via-sky-500 to-slate-900 px-8 py-6 text-white shadow-lg shadow-sky-300/40">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Coaching MyPlanningAI</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight">Organise ta journée en 1 clic</h2>
          <p className="mt-2 text-sm text-white/85">
            Décris ton flow, l’IA propose des tâches classées et tu envoies tout dans ton planning.
          </p>
        </div>
        {showCoachingGuide && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-inner">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-3 w-full lg:w-auto">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mode d’emploi</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    "Décris ta journée dans la zone de texte.",
                    "Clique sur “Générer des tâches”.",
                    "L’IA classe par priorité (Eisenhower).",
                    "Ajoute en 1 clic dans ton planning.",
                  ].map((step, idx) => (
                    <div key={step} className="flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 shadow-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="text-xs text-slate-500 hover:text-slate-700"
                onClick={() => {
                  setShowCoachingGuide(false);
                  if (typeof window !== "undefined") window.localStorage.setItem("myplanning.coaching.guide", "hidden");
                }}
              >
                Masquer ✕
              </button>
            </div>
          </div>
        )}
      {aiSummary && (
        <div className="flex items-start justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div>
            <p className="font-semibold">
              {aiSummary.total} tâche{aiSummary.total > 1 ? "s" : ""} générée{aiSummary.total > 1 ? "s" : ""} pour aujourd’hui
            </p>
            <p className="text-[13px]">
              {aiSummary.counts.important_not_urgent} importantes, {aiSummary.counts.urgent_important} urgentes & importantes,{" "}
              {aiSummary.counts.urgent_not_important} urgentes moins importantes, {aiSummary.counts.not_urgent_not_important} autres.{" "}
              {aiSummary.highImpact} tâche{aiSummary.highImpact > 1 ? "s" : ""} à impact élevé.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveSection("manage")} className="text-xs font-semibold text-emerald-800 underline">
              Voir dans Gérer les tâches
            </button>
            <button className="text-xs text-emerald-700 hover:text-emerald-900" onClick={() => setAiSummary(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
      {aiSummaryError && (
        <div className="flex items-start justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{aiSummaryError}</span>
          <button className="text-xs text-rose-700 hover:text-rose-900" onClick={() => setAiSummaryError(null)}>
            ✕
          </button>
        </div>
      )}
      <div className="mt-3 flex w-full flex-col gap-3">
        <textarea
          value={aiText}
          onChange={(event) => setAiText(event.target.value)}
          placeholder="Décrivez votre journée... (horaires, focus, pauses, messages à traiter, sport, etc.)"
          className="h-36 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm shadow-inner focus:border-sky-500 focus:outline-none"
        />
        <div className="flex justify-center">
          <button
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:-translate-y-[1px] hover:bg-sky-700 disabled:opacity-60"
          >
            {aiLoading ? "Analyse en cours..." : "Générer des tâches"}
            {!aiLoading && <span aria-hidden>→</span>}
          </button>
        </div>
        {aiLoading && <p className="text-center text-xs text-slate-500">Cohere peut prendre jusqu’à ~30 s. Merci de patienter...</p>}
      </div>
      {aiDrafts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <span>{aiDrafts.length} tâche(s) proposées</span>
          <button
            onClick={async () => {
              const notAdded = aiDrafts.filter((d) => !addedDrafts.has(d.title));
              if (!notAdded.length) return;
              setBulkAdding(true);
              try {
                const payload = notAdded.map((draft) => {
                  const priority = draft.priority_eisenhower || computePriority(draft.title, draft.description);
                  const impact = typeof draft.high_impact === "boolean" ? draft.high_impact : computeImpact(draft.title, draft.description);
                  return {
                    title: draft.title,
                    description: draft.description || "",
                    comments: draft.description || "",
                    priority_eisenhower: priority,
                    high_impact: impact,
                    estimated_duration_minutes: draft.estimated_duration_minutes || undefined,
                    kanban_state: "todo" as KanbanState,
                    due_datetime: draft.due_datetime || toIsoDate(selectedDate),
                    source: "ia" as TaskSource,
                    category: draft.category || undefined,
                  };
                });
                const res = await apiFetch<{ items: Task[] }>("/tasks/bulk_create", { method: "POST", body: JSON.stringify(payload) });
                setTasks((prev) => [...res.items, ...prev]);
                setAddedDrafts(new Set([...Array.from(addedDrafts), ...notAdded.map((d) => d.title)]));
                setBanner({ type: "success", message: `${res.items.length} tâche(s) ajoutée(s) à votre planning d'aujourd'hui` });
                void loadTasks();
              } catch (err) {
                const message = err instanceof Error ? friendlyError(err.message) : "Impossible d'ajouter ces tâches";
                setBanner({ type: "error", message });
              } finally {
                setBulkAdding(false);
              }
            }}
            disabled={bulkAdding || aiDrafts.every((d) => addedDrafts.has(d.title))}
            className="rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white disabled:opacity-50"
          >
            {bulkAdding ? "Ajout..." : "Ajouter toutes les tâches à MyPlanningAI"}
          </button>
        </div>
      )}
      {aiDrafts.length > 0 && (
        <div className="mt-2 space-y-2 text-sm">
	              {sortByPriorityThenHour(aiDrafts).map((draft, idx) => (
	                <div key={`${draft.title}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
	                  <div className="flex items-center justify-between text-[11px] text-slate-500">
	                    <span>{draft.priority_eisenhower ? PRIORITY_LABEL[draft.priority_eisenhower] : "Priorité"}</span>
	                    {draft.high_impact && <span className="text-emerald-600">Impact élevé</span>}
	                  </div>
              <p className="font-semibold text-slate-900">{draft.title}</p>
              {draft.description && <p className="text-xs text-slate-500">{draft.description}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setFormValues({
                      title: draft.title,
                      comments: draft.description || "",
                      description: draft.description || "",
                      priority_eisenhower: draft.priority_eisenhower || "important_not_urgent",
                      high_impact: Boolean(draft.high_impact),
                      estimated_duration_minutes: draft.estimated_duration_minutes || undefined,
                      source: "ia",
                      due_datetime: draft.due_datetime || toIsoDate(selectedDate),
                    });
                    setEditingId(null);
                    setActiveSection("create");
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  Pré-remplir
                </button>
                <button
                  onClick={() => void handleAddDraft(draft, idx)}
                  disabled={addingDraftIndex === idx || addedDrafts.has(draft.title)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-60"
                >
                  {addedDrafts.has(draft.title) ? "Ajoutée" : addingDraftIndex === idx ? "Ajout..." : "Ajouter à mes tâches"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );

  const renderSettings = () => {
    if (!hasPlanAccess(plan, "pro")) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Pro</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">Paramètres IA</h2>
          <p className="mt-2 text-sm text-slate-600">Les paramètres IA sont disponibles en Pro.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/myplanning/pricing?upgrade=pro&feature=settings&message=Fonctionnalit%C3%A9%20Pro%20-%20d%C3%A9bloque%20le%20pilotage%20avanc%C3%A9."
              className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Voir l’offre Pro
            </Link>
            <button
              onClick={() => setActiveSection("dashboard")}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Plus tard
            </button>
          </div>
        </div>
      );
    }
    return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Paramètres IA</h2>
      <p className="text-sm text-slate-600">
        Ajustez l’autonomie, le style de coaching et les horaires silencieux. Ces préférences sont stockées sur votre appareil.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Niveau d’autonomie</span>
          <select
            value={iaSettings.autonomy}
            onChange={(e) =>
              setIaSettings((prev) => {
                const next = { ...prev, autonomy: e.target.value as typeof prev.autonomy };
                if (typeof window !== "undefined") window.localStorage.setItem("myplanning.ia.settings", JSON.stringify(next));
                return next;
              })
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="low">Bas (tu proposes, je choisis)</option>
            <option value="medium">Moyen (suggestions & classement)</option>
            <option value="high">Élevé (propositions + actions rapides)</option>
          </select>
          <span className="text-[11px] text-slate-500">Impacte la densité des suggestions et l’auto-classement.</span>
        </label>
        <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Style de coaching</span>
          <select
            value={iaSettings.tone}
            onChange={(e) =>
              setIaSettings((prev) => {
                const next = { ...prev, tone: e.target.value as typeof prev.tone };
                if (typeof window !== "undefined") window.localStorage.setItem("myplanning.ia.settings", JSON.stringify(next));
                return next;
              })
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="concise">Concise</option>
            <option value="coach">Coach (motivation & explications)</option>
            <option value="strict">Strict (court et directif)</option>
          </select>
          <span className="text-[11px] text-slate-500">Ajuste le ton des messages IA.</span>
        </label>
        <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Plage horaire active</span>
          <input
            type="text"
            value={iaSettings.quietHours}
            onChange={(e) =>
              setIaSettings((prev) => {
                const next = { ...prev, quietHours: e.target.value };
                if (typeof window !== "undefined") window.localStorage.setItem("myplanning.ia.settings", JSON.stringify(next));
                return next;
              })
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            placeholder="Ex: 06:00-22:00"
          />
          <span className="text-[11px] text-slate-500">Période où l’IA peut proposer/relancer.</span>
        </label>
        <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Notifications IA</span>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={iaSettings.notifications}
              onChange={(e) =>
                setIaSettings((prev) => {
                  const next = { ...prev, notifications: e.target.checked };
                  if (typeof window !== "undefined") window.localStorage.setItem("myplanning.ia.settings", JSON.stringify(next));
                  return next;
                })
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-600">Autoriser les alertes IA (rappels, focus du jour).</span>
          </div>
        </label>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem("myplanning.ia.settings", JSON.stringify(iaSettings));
            }
            setBanner({ type: "success", message: "Paramètres IA mis à jour (stockés localement)." });
          }}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          Enregistrer les paramètres
        </button>
      </div>
    </div>
  );
  };

  const renderAutomations = () => {
    if (!hasPlanAccess(plan, "pro")) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Pro (bêta)</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">Automatisations</h2>
          <p className="mt-2 text-sm text-slate-600">Fonctionnalité Pro (bêta) — Passe à l’offre Pro pour y accéder.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/myplanning/pricing?upgrade=pro&feature=automations&message=Fonctionnalit%C3%A9%20Pro%20-%20d%C3%A9bloque%20le%20pilotage%20avanc%C3%A9."
              className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Voir l’offre Pro
            </Link>
            <button
              onClick={() => setActiveSection("dashboard")}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Plus tard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Automatisations</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Automatisations <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BETA</span>
        </h2>
        <p className="mt-2 text-sm text-slate-600">Structure prête. Les déclencheurs et actions réelles arrivent bientôt.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Créer tâche récurrente", "Rappel intelligent", "Blocage auto du focus", "Règles de priorités"].map((label) => (
            <button
              key={label}
              disabled
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-500"
            >
              {label} (bientôt)
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderTemplates = () => {
    if (!hasPlanAccess(plan, "pro")) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Pro (bêta)</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">Templates universels</h2>
          <p className="mt-2 text-sm text-slate-600">Fonctionnalité Pro (bêta) — Passe à l’offre Pro pour y accéder.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/myplanning/pricing?upgrade=pro&feature=templates&message=Fonctionnalit%C3%A9%20Pro%20-%20d%C3%A9bloque%20le%20pilotage%20avanc%C3%A9."
              className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Voir l’offre Pro
            </Link>
            <button
              onClick={() => setActiveSection("dashboard")}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Plus tard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Templates universels</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Templates <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BETA</span>
        </h2>
        <p className="mt-2 text-sm text-slate-600">Bibliothèque de templates prête pour étudiants, freelances et entrepreneurs.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["Étudiant", "Freelance", "Entrepreneur"].map((label) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="mt-1 text-xs text-slate-500">Template prêt à personnaliser.</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "weekly":
        return renderWeekly();
      case "matrix":
        return renderMatrix();
      case "stats":
        return renderStats();
      case "create":
        return renderCreateForm();
      case "manage":
        return renderManage();
      case "coaching":
        return renderCoaching();
      case "templates":
        return renderTemplates();
      case "automations":
        return renderAutomations();
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  const sidebarWidth = isSidebarCollapsed ? "72px" : "260px";
  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 flex min-h-screen w-full overflow-hidden bg-slate-100"
    : variant === "product"
      ? "flex min-h-screen w-full overflow-hidden bg-slate-100"
      : "flex h-[calc(100vh-90px)] w-full flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl";
  const showProductDesktopSidebar = variant === "product" && productDesktopNav === "sidebar" && !isFullscreen;
  const showProductBottomNav = variant === "product" && !isFullscreen;
  const contentPaddingBottomClass =
    variant === "product" ? (productDesktopNav === "sidebar" ? "pb-24 md:pb-6" : "pb-24") : "";
  const shouldBlockOnboarding = variant === "product" && (onboardingLoading || !onboardingData.onboarding_completed);

  if (shouldBlockOnboarding) {
    return (
      <div className="w-full py-6 sm:py-10">
        {onboardingLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600 shadow-sm">
            Chargement de l’onboarding…
          </div>
        ) : (
          <>
            {renderOnboarding()}
            <div className="mt-4 text-center">
              <button
                onClick={() => void loadOnboardingState()}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-700"
              >
                Recharger l’onboarding
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {variant === "learning" ? (
        <aside
          className="flex h-full flex-col gap-6 border-r border-slate-200 bg-white/95 p-4 transition-[width] duration-200"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">MyPlanningAI</p>
                <p className="text-lg font-semibold text-slate-900">Cockpit</p>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed((v) => !v)}
              className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              title={isSidebarCollapsed ? "Déployer" : "Réduire"}
            >
              {isSidebarCollapsed ? "»" : "«"}
            </button>
          </div>
          <nav className="space-y-6 text-sm font-semibold">
            <div>
              <p className={`text-xs uppercase text-slate-400 ${isSidebarCollapsed ? "text-center" : ""}`}>Vues</p>
              <div className="mt-2 space-y-2">
                {VIEWS.map((item) => {
                  const locked = !hasPlanAccess(plan, item.minPlan);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionClick(item.id)}
                      className={`flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-left transition ${
                        activeSection === item.id ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      title={item.label}
                    >
                      <span>{item.icon}</span>
                      {!isSidebarCollapsed && (
                        <span className="flex-1">
                          {item.label}
                          {locked ? (
                            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                              {lockedBadgeLabel(item.minPlan, item.beta)}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className={`text-xs uppercase text-slate-400 ${isSidebarCollapsed ? "text-center" : ""}`}>Actions</p>
              <div className="mt-2 space-y-2">
                {ACTIONS.map((item) => {
                  const locked = !hasPlanAccess(plan, item.minPlan);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionClick(item.id)}
                      className={`flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-left transition ${
                        activeSection === item.id ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      title={item.label}
                    >
                      <span>{item.icon}</span>
                      {!isSidebarCollapsed && (
                        <span className="flex-1">
                          {item.label}
                          {locked ? (
                            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                              {lockedBadgeLabel(item.minPlan, item.beta)}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </aside>
      ) : null}
      {showProductDesktopSidebar ? (
        <aside
          className="hidden h-full shrink-0 flex-col border-r border-slate-200 bg-white/95 p-3 pl-4 lg:flex"
          style={{ width: isSidebarCollapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)" }}
        >
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2">
            {!isSidebarCollapsed ? (
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">MyPlanningAI</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">App</p>
              </div>
            ) : (
              <p className="w-full text-center text-xs font-semibold text-slate-500">MP</p>
            )}
            <button
              onClick={() => setIsSidebarCollapsed((value) => !value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-700"
              title={isSidebarCollapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
            >
              {isSidebarCollapsed ? "»" : "«"}
            </button>
          </div>
          <nav className="mt-4 space-y-5 text-sm font-semibold">
            <div>
              {!isSidebarCollapsed ? <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vues</p> : null}
              <div className="mt-2 space-y-2">
                {VIEWS.map((item) => {
                  const locked = !hasPlanAccess(plan, item.minPlan);
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionClick(item.id)}
                      className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
                        active ? "bg-sky-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      title={item.label}
                    >
                      <span>{item.icon}</span>
                      {!isSidebarCollapsed ? <span className="flex-1">{item.label}</span> : null}
                      {locked && !isSidebarCollapsed ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-sky-100 text-sky-700"}`}>
                          {lockedBadgeLabel(item.minPlan, item.beta)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              {!isSidebarCollapsed ? <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Actions</p> : null}
              <div className="mt-2 space-y-2">
                {ACTIONS.map((item) => {
                  const locked = !hasPlanAccess(plan, item.minPlan);
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionClick(item.id)}
                      className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
                        active ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      title={item.label}
                    >
                      <span>{item.icon}</span>
                      {!isSidebarCollapsed ? <span className="flex-1">{item.label}</span> : null}
                      {locked && !isSidebarCollapsed ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-sky-100 text-sky-700"}`}>
                          {lockedBadgeLabel(item.minPlan, item.beta)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </aside>
      ) : null}
      <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
        <div className="sticky top-0 z-20 border-b border-slate-100 bg-slate-50/95 px-2 py-3 text-sm text-slate-600 backdrop-blur sm:px-3">
          <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateWithFallback("/")}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                >
                  ← Site KORYXA
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithFallback("/myplanning")}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                >
                  Accueil MyPlanning
                </button>
              </div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                {MYPLANNING_MENU_ITEMS.find((item) => item.id === activeSection)?.label || "MyPlanningAI"}
              </p>
              <p className="text-lg font-semibold text-slate-900">{dayFormatter.format(selectedDate)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => shiftSelectedDate(-1)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                ← Jour précédent
              </button>
              <input
                type="date"
                value={dateInputValue}
                onChange={(event) => {
                  const next = new Date(event.target.value);
                  if (!Number.isNaN(next.getTime())) setSelectedDateAndFocus(next);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs"
              />
              <button onClick={() => shiftSelectedDate(1)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                Jour suivant →
              </button>
              <button
                onClick={() => handleSectionClick("coaching")}
                className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                Organiser ma journée (IA)
              </button>
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Quitter le plein écran (Esc)" : "Activer le plein écran"}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50"
              >
                <span aria-hidden className="text-sm leading-none">{isFullscreen ? "🗗" : "⛶"}</span>
                {isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              </button>
            </div>
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto p-2 sm:p-3 ${contentPaddingBottomClass}`}>
          <div className="mx-auto w-full">
            {banner && (
              <div
                className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                  banner.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {banner.message}
              </div>
            )}
            {renderSection()}
          </div>
        </div>
      </main>

      {showProductBottomNav ? (
        <div
          className={`fixed bottom-4 left-1/2 z-50 w-[min(980px,calc(100vw-24px))] -translate-x-1/2 ${
            productDesktopNav === "sidebar" ? "lg:hidden" : ""
          }`}
        >
          <div className="rounded-3xl border border-slate-200/70 bg-white/95 px-3 py-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[...VIEWS, ...ACTIONS].map((item) => {
                const locked = !hasPlanAccess(plan, item.minPlan);
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionClick(item.id)}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-sky-600 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    title={item.label}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {locked ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-sky-100 text-sky-700"}`}>
                        {lockedBadgeLabel(item.minPlan, item.beta)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <PaywallModal
        open={Boolean(paywallFeature)}
        title="Fonctionnalité Pro (bêta)"
        message="Cette fonctionnalité t’aide à mieux exécuter. Disponible avec MyPlanningAI Pro."
        ctaHref={paywallFeature ? `/myplanning/pricing?upgrade=pro&feature=${paywallFeature}` : "/myplanning/pricing?upgrade=pro"}
        onClose={closePaywall}
      />

    </div>
  );
}
