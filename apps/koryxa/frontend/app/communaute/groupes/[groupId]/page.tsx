import CommunityGroupPage from "../../../community/groups/[groupId]/page";

type CommunauteGroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function CommunauteGroupPage(props: CommunauteGroupPageProps) {
  const { groupId } = await props.params;
  return <CommunityGroupPage params={Promise.resolve({ groupId })} />;
}
