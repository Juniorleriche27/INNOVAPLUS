import SignupClient from "@/app/signup/SignupClient";

export default function MyPlanningSignupPage() {
  return (
    <SignupClient
      successRedirect="/myplanning/app/koryxa-home"
      heading="Créer un compte KORYXA"
      subtitle="Crée ton compte pour accéder à l’espace connecté KORYXA et au moteur MyPlanningAI."
      loginHref="/myplanning/login?redirect=/myplanning/app/koryxa-home"
      loginLabel="Se connecter à KORYXA"
    />
  );
}
