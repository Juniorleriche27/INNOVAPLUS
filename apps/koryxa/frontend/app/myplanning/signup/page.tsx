import SignupClient from "@/app/signup/SignupClient";

export default function MyPlanningSignupPage() {
  return (
    <SignupClient
      successRedirect="/myplanning/app"
      heading="Créer un compte MyPlanning"
      subtitle="Crée ton compte pour démarrer ton cockpit de planification."
      loginHref="/myplanning/login?redirect=/myplanning/app"
      loginLabel="Se connecter à MyPlanning"
    />
  );
}
