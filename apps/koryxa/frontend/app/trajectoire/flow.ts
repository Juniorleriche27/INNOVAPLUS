export const FLOW_STORAGE_KEY = "koryxa.trajectory.flowId";

export type ValidationLevel = "initial" | "building" | "validated" | "advanced";

export type TrajectoryFlowResponse = {
  flow_id: string;
  guest_id: string;
  status: string;
  onboarding: {
    name?: string | null;
    objective: string;
    current_level: string;
    domain_interest: string;
    weekly_rhythm: string;
    target_outcome?: string | null;
    context?: string | null;
    constraints: string[];
    preferences: string[];
    current_status?: string | null;
    current_role?: string | null;
    target_roles: string[];
    existing_skills: string[];
    portfolio_status?: string | null;
    target_timeline?: string | null;
    learning_style?: string | null;
    support_style?: string | null;
    language_preference?: string | null;
    motivation_driver?: string | null;
    project_topic?: string | null;
    success_metric?: string | null;
    exercise_results: string[];
  };
  diagnostic: {
    profile_summary: string;
    recommended_trajectory: {
      title: string;
      rationale: string;
      mission_focus: string;
    };
    recommended_resources: Array<{
      type: string;
      label: string;
      reason: string;
    }>;
    recommended_partners: Array<{
      type: "organisme" | "plateforme" | "coach";
      label: string;
      reason: string;
      match_score: number;
    }>;
    next_steps: string[];
    readiness: {
      initial_score: number;
      progress_score: number;
      readiness_score: number;
      label: string;
      validation_status: string;
      validation_level: ValidationLevel;
    };
  } | null;
  final_recommendation: string | null;
};

export type TrainingContactPayload = {
  first_name: string;
  last_name: string;
  email: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
};
