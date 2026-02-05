export const revalidate = 0;
export const dynamic = "force-dynamic";

import MyPlanningClient from "../MyPlanningClient";

export default function MyPlanningAppPage() {
  return <MyPlanningClient variant="product" />;
}

