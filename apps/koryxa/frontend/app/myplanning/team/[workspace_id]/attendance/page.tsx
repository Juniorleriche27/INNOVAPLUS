import TeamAttendanceClient from "../../_components/TeamAttendanceClient";

type Props = {
  params: Promise<{ workspace_id: string }> | { workspace_id: string };
};

async function resolveParams(input: Props["params"]): Promise<{ workspace_id: string }> {
  if (typeof (input as Promise<{ workspace_id: string }>).then === "function") {
    return await (input as Promise<{ workspace_id: string }>);
  }
  return input as { workspace_id: string };
}

export default async function MyPlanningTeamAttendancePage({ params }: Props) {
  const resolved = await resolveParams(params);
  return <TeamAttendanceClient workspaceId={resolved.workspace_id} />;
}

