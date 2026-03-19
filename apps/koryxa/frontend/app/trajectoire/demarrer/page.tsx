import TrajectoryFlowClient from "../TrajectoryFlowClient";

export default function TrajectoireDemarrerPage() {
  return (
    <main className="px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <TrajectoryFlowClient />
      </div>
    </main>
  );
}
