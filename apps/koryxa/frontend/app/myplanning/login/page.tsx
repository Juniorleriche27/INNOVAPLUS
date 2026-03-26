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
  const requestedRedirect = one(params?.redirect) || "/myplanning/app/koryxa-home";

  return (
    <LoginClient
      defaultRedirect="/myplanning/app/koryxa-home"
      requestedRedirect={requestedRedirect}
      heading="Connexion KORYXA"
      subtitle="Connecte-toi pour accéder à ton espace connecté KORYXA et au moteur MyPlanningAI."
      supportLabel="Support KORYXA"
      supportHref="/account/recover"
      signupHref="/myplanning/signup?redirect=/myplanning/app/koryxa-home"
      signupLabel="Créer un compte KORYXA"
    />
  );
}
