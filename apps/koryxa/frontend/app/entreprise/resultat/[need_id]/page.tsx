import EnterpriseResultClient from "./EnterpriseResultClient";

type Props = {
  params: {
    need_id: string;
  };
};

export default function EntrepriseResultPage({ params }: Props) {
  return <EnterpriseResultClient needId={params.need_id} />;
}
