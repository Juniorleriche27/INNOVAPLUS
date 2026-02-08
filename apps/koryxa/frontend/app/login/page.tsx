export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import LoginClient from "./LoginClient";

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

export default async function LoginPage({ searchParams }: { searchParams?: SearchParamsInput }) {
  const params = await resolveSearchParams(searchParams);
  const requestedRedirect = one(params?.redirect);
  return <LoginClient requestedRedirect={requestedRedirect} />;
}
