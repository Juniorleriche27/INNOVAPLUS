import CommunityPostPage from "../../../community/posts/[postId]/page";

type CommunautePostPageProps = {
  params: Promise<{ postId: string }>;
};

export default async function CommunautePostPage(props: CommunautePostPageProps) {
  const { postId } = await props.params;
  return <CommunityPostPage params={Promise.resolve({ postId })} />;
}
