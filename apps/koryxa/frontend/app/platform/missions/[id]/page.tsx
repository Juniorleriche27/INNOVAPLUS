import MissionTrackPage from "../../../missions/track/[missionId]/page";

type PlatformMissionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlatformMissionPage(props: PlatformMissionPageProps) {
  const { id } = await props.params;
  return <MissionTrackPage params={Promise.resolve({ missionId: id })} />;
}
