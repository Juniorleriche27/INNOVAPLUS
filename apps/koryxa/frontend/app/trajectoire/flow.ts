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
  progress_plan: {
    title: string;
    next_actions: string[];
    progress_score: number;
    readiness_score: number;
    validation_level: ValidationLevel;
  } | null;
  verified_profile: {
    profile_status: "not_ready" | "eligible" | "verified";
    progress_score: number;
    readiness_score: number;
    validation_level: ValidationLevel;
    validated_proof_count: number;
    minimum_validated_proofs: number;
    minimum_readiness_score: number;
    shareable_headline?: string;
    summary?: string;
  } | null;
  opportunity_targets: Array<{
    label: string;
    type: "mission" | "stage" | "collaboration" | "project" | "accompagnement";
    reason: string;
    visibility_status: "recommended" | "unlocked" | "prioritized";
  }>;
};

export type TrajectoryCockpitActivationResponse = {
  status: "ready" | "auth_required";
  flow_id: string;
  context_id: string;
  redirect_url: string;
};
