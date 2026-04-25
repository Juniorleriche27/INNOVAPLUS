import type { Metadata } from "next";
import TrajectoryFlowClient from "../TrajectoryFlowClient";

export const metadata: Metadata = {
  title: "Démarrer Formation IA | KORYXA",
  description: "Lancez directement le tunnel Formation IA KORYXA.",
};

export default function TrajectoireDemarrerPage() {
  return <TrajectoryFlowClient />;
}
