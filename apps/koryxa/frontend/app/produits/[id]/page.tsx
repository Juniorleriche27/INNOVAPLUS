import ProductPage from "../../products/[slug]/page";

type ProduitsDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProduitsDetailPage(props: ProduitsDetailPageProps) {
  const { id } = await props.params;
  return <ProductPage params={Promise.resolve({ slug: id })} />;
}
