import CommunityGroupPage from "../../../../community/groups/[groupId]/page";

type PlatformCommunauteGroupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlatformCommunauteGroupPage(props: PlatformCommunauteGroupPageProps) {
  const { id } = await props.params;
  return <CommunityGroupPage params={Promise.resolve({ groupId: id })} />;
}
