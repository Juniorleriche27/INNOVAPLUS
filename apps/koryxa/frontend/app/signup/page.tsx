import SignupClient from "./SignupClient";

type SearchParams = Record<string, string | string[] | undefined>;
type SearchParamsInput = SearchParams | Promise<SearchParams>;

const KORYXA_PUBLIC_HOME = "/";

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

export default async function SignupPage({ searchParams }: { searchParams?: SearchParamsInput }) {
  const params = await resolveSearchParams(searchParams);
  const requestedRedirect = one(params?.redirect);
  const successRedirect =
    requestedRedirect && requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : KORYXA_PUBLIC_HOME;
  const loginHref = `/login?redirect=${encodeURIComponent(successRedirect)}`;

  return <SignupClient successRedirect={successRedirect} loginHref={loginHref} />;
}
