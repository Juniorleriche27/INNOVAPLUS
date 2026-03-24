import CommunityPostPage from "../../../../community/posts/[postId]/page";

type PlatformCommunautePostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlatformCommunautePostPage(props: PlatformCommunautePostPageProps) {
  const { id } = await props.params;
  return <CommunityPostPage params={Promise.resolve({ postId: id })} />;
}
