"use client";

import { AttendanceApiError, myplanningRequest } from "@/app/myplanning/components/attendanceApi";

export type OrganizationRole = "owner" | "admin" | "member";
export type OrganizationStatus = "trial" | "active";

export type Organization = {
  id: string;
  name: string;
  owner_id: string;
  role: OrganizationRole;
  status: OrganizationStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

export type OrganizationDetail = Organization & {
  member_count: number;
  workspace_count: number;
};

export type OrganizationWorkspaceResult = {
  organization_id: string;
  workspace: {
    id: string;
    name: string;
    role: "owner" | "admin" | "member";
    owner_user_id: string;
    member_count: number;
    created_at?: string | null;
    updated_at?: string | null;
  };
};

export type Department = {
  id: string;
  workspace_id: string;
  name: string;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type N8nIntegrationConfig = {
  workspace_id: string;
  n8n_webhook_url: string | null;
  enabled: boolean;
  secret: string;
  updated_at?: string | null;
};

export type N8nIntegrationTestResult = {
  ok: boolean;
  event_id: number;
  delivery_status: string;
  response_code: number | null;
};

export class EnterpriseApiError extends AttendanceApiError {}

export async function listOrgs(): Promise<Organization[]> {
  return myplanningRequest<Organization[]>("/orgs");
}

export async function getOrg(orgId: string): Promise<OrganizationDetail> {
  return myplanningRequest<OrganizationDetail>(`/orgs/${encodeURIComponent(orgId)}`);
}

export async function createOrg(name: string): Promise<Organization> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new EnterpriseApiError(400, "Le nom de l'organisation est requis.", {});
  }
  return myplanningRequest<Organization>("/orgs", {
    method: "POST",
    body: JSON.stringify({ name: trimmed }),
  });
}

export async function createOrgWorkspace(
  orgId: string,
  params: { name?: string; workspace_id?: string },
): Promise<OrganizationWorkspaceResult> {
  return myplanningRequest<OrganizationWorkspaceResult>(`/orgs/${encodeURIComponent(orgId)}/workspaces`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function listOrgWorkspaces(orgId: string): Promise<OrganizationWorkspaceResult["workspace"][]> {
  return myplanningRequest<OrganizationWorkspaceResult["workspace"][]>(`/orgs/${encodeURIComponent(orgId)}/workspaces`);
}

export async function listWorkspaceDepartments(workspaceId: string): Promise<Department[]> {
  return myplanningRequest<Department[]>(`/workspaces/${encodeURIComponent(workspaceId)}/departments`);
}

export async function createWorkspaceDepartment(workspaceId: string, name: string): Promise<Department> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new EnterpriseApiError(400, "Le nom du département est requis.", {});
  }
  return myplanningRequest<Department>(`/workspaces/${encodeURIComponent(workspaceId)}/departments`, {
    method: "POST",
    body: JSON.stringify({ name: trimmed }),
  });
}

export async function getWorkspaceN8nIntegration(workspaceId: string): Promise<N8nIntegrationConfig> {
  return myplanningRequest<N8nIntegrationConfig>(`/workspaces/${encodeURIComponent(workspaceId)}/integrations/n8n`);
}

export async function patchWorkspaceN8nIntegration(
  workspaceId: string,
  payload: { n8n_webhook_url?: string | null; enabled?: boolean; secret?: string | null },
): Promise<N8nIntegrationConfig> {
  return myplanningRequest<N8nIntegrationConfig>(`/workspaces/${encodeURIComponent(workspaceId)}/integrations/n8n`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function testWorkspaceN8nIntegration(
  workspaceId: string,
  eventType = "manual.test",
): Promise<N8nIntegrationTestResult> {
  return myplanningRequest<N8nIntegrationTestResult>(`/workspaces/${encodeURIComponent(workspaceId)}/integrations/n8n/test`, {
    method: "POST",
    body: JSON.stringify({ event_type: eventType }),
  });
}
