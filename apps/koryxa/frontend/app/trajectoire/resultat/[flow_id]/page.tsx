import TrajectoryResultClient from "./TrajectoryResultClient";

type Props = {
  params: {
    flow_id: string;
  };
};

export default function TrajectoireResultPage({ params }: Props) {
  return <TrajectoryResultClient flowId={params.flow_id} />;
}
