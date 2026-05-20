import { ClientsManager } from "@/features/client/clients-manager";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getClients } from "@/query/client/get-clients";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RoutePage />
    </Suspense>
  );
}

async function RoutePage() {
  const { id: orgId } = await getRequiredCurrentOrgCache();
  const clients = await getClients(orgId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-muted-foreground text-sm">
          Votre carnet de clients réutilisables.
        </p>
      </div>
      <ClientsManager clients={clients} />
    </div>
  );
}
