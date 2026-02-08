import LoginClient from "@/app/login/LoginClient";

export default function MyPlanningLoginPage() {
  return (
    <LoginClient
      defaultRedirect="/myplanning/app"
      heading="Connexion MyPlanning"
      subtitle="Connecte-toi pour accéder à ton cockpit MyPlanning."
      supportLabel="Support MyPlanning"
      supportHref="/account/recover"
      signupHref="/myplanning/signup?redirect=/myplanning/app"
      signupLabel="Créer un compte MyPlanning"
    />
  );
}
