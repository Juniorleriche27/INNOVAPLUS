import EnterpriseFlowClient from "../EnterpriseFlowClient";

export default function EntrepriseDemarrerPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <EnterpriseFlowClient />
      </div>
    </main>
  );
}
