import TrajectoryResultClient from "./TrajectoryResultClient";

type Props = {
  params: Promise<{ flow_id: string }> | { flow_id: string };
};

async function resolveParams(input: Props["params"]): Promise<{ flow_id: string }> {
  if (typeof (input as Promise<{ flow_id: string }>).then === "function") {
    return await (input as Promise<{ flow_id: string }>);
  }
  return input as { flow_id: string };
}

export default async function TrajectoireResultPage({ params }: Props) {
  const resolved = await resolveParams(params);
  return <TrajectoryResultClient flowId={resolved.flow_id} />;
}
