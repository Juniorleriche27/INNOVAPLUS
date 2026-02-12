import TeamWorkspaceDetailClient from "../_components/TeamWorkspaceDetailClient";

type Props = {
  params: Promise<{ workspace_id: string }> | { workspace_id: string };
};

async function resolveParams(input: Props["params"]): Promise<{ workspace_id: string }> {
  if (typeof (input as Promise<{ workspace_id: string }>).then === "function") {
    return await (input as Promise<{ workspace_id: string }>);
  }
  return input as { workspace_id: string };
}

export default async function MyPlanningTeamWorkspacePage({ params }: Props) {
  const resolved = await resolveParams(params);
  return <TeamWorkspaceDetailClient workspaceId={resolved.workspace_id} />;
}
