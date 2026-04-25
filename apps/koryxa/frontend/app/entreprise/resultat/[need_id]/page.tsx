import EnterpriseResultClient from "./EnterpriseResultClient";

type Props = {
  params: Promise<{ need_id: string }> | { need_id: string };
};

async function resolveParams(input: Props["params"]): Promise<{ need_id: string }> {
  if (typeof (input as Promise<{ need_id: string }>).then === "function") {
    return await (input as Promise<{ need_id: string }>);
  }
  return input as { need_id: string };
}

export default async function EntrepriseResultPage({ params }: Props) {
  const resolved = await resolveParams(params);
  return <EnterpriseResultClient needId={resolved.need_id} />;
}
