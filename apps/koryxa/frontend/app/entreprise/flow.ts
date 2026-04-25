export const ENTERPRISE_STORAGE_KEY = "koryxa.enterprise.needId";

export type EnterpriseSubmissionResponse = {
  need: {
    id: string;
    title: string;
    company_name: string;
    primary_goal: string;
    need_type: string;
    expected_result: string;
    urgency: string;
    treatment_preference: string;
    recommended_treatment_mode: "prive" | "publie" | "accompagne";
    team_context: string;
    support_preference: string;
    short_brief?: string | null;
    status: string;
    qualification_score: number;
    clarity_level: string;
    structured_summary: string;
    next_recommended_action: string;
  };
  mission: {
    id: string;
    need_id: string;
    title: string;
    summary: string;
    deliverable: string;
    execution_mode: string;
    status: string;
    steps: string[];
  };
  opportunity: {
    id: string;
    need_id: string;
    mission_id: string;
    type: "mission" | "stage" | "collaboration" | "project" | "accompagnement";
    title: string;
    summary: string;
    status: string;
    highlights: string[];
  } | null;
};

export type EnterpriseCockpitActivationResponse = {
  status: "ready" | "auth_required";
  need_id: string;
  context_id: string;
  redirect_url: string;
};
