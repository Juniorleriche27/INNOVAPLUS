import OpportunityPage from "../../opportunities/[id]/page";

type OpportunitePageProps = {
  params: Promise<{ id: string }>;
};

export default async function OpportunitePage(props: OpportunitePageProps) {
  const { id } = await props.params;
  return <OpportunityPage params={Promise.resolve({ id })} />;
}
