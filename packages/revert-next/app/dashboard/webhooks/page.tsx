import { inter } from "@revertdotdev/components/fonts";
import DashboardHeader from "@revertdotdev/components/ui/DashboardHeader";

export default async function Page() {
  return (
    <main>
      <DashboardHeader
        title="Webhooks"
        description="Configure and Manage your Webhook Endpoints here"
      />
    </main>
  );
}
