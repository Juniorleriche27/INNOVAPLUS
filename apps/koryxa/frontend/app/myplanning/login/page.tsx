import LoginClient from "@/app/login/LoginClient";

type SearchParams = Record<string, string | string[] | undefined>;
type SearchParamsInput = SearchParams | Promise<SearchParams>;

function one(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function resolveSearchParams(input?: SearchParamsInput): Promise<SearchParams | undefined> {
  if (!input) return undefined;
  if (typeof (input as Promise<SearchParams>).then === "function") {
    return await (input as Promise<SearchParams>);
  }
  return input as SearchParams;
}

export default async function MyPlanningLoginPage({ searchParams }: { searchParams?: SearchParamsInput }) {
  const params = await resolveSearchParams(searchParams);
  const requestedRedirect = one(params?.redirect) || "/myplanning/app";

  return (
    <LoginClient
      defaultRedirect="/myplanning/app"
      requestedRedirect={requestedRedirect}
      heading="Connexion MyPlanning"
      subtitle="Connecte-toi pour accéder à ton cockpit MyPlanning."
      supportLabel="Support MyPlanning"
      supportHref="/account/recover"
      signupHref="/myplanning/signup?redirect=/myplanning/app"
      signupLabel="Créer un compte MyPlanning"
    />
  );
}
