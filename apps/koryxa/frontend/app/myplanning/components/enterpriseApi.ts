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

export class EnterpriseApiError extends AttendanceApiError {}

export async function listOrgs(): Promise<Organization[]> {
  return myplanningRequest<Organization[]>("/orgs");
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

