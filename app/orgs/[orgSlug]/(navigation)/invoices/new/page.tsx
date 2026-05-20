import { Typography } from "@/components/nowts/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvoiceForm } from "@/features/invoice/invoice-form";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import type { TaxRegime } from "@/lib/tax/pf";
import { getClients } from "@/query/client/get-clients";
import Link from "next/link";
import { Suspense } from "react";

export default function Page(props: PageProps<"/orgs/[orgSlug]/invoices/new">) {
  return (
    <Suspense fallback={null}>
      <RoutePage {...props} />
    </Suspense>
  );
}

async function RoutePage(props: PageProps<"/orgs/[orgSlug]/invoices/new">) {
  const params = await props.params;
  const { id: orgId } = await getRequiredCurrentOrgCache();

  const [company, clients] = await Promise.all([
    prisma.company.findUnique({
      where: { organizationId: orgId },
      select: { taxRegime: true },
    }),
    getClients(orgId),
  ]);

  if (!company) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profil entreprise requis</CardTitle>
          <CardDescription>
            Renseignez d'abord votre entreprise avant de créer une facture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`/orgs/${params.orgSlug}/company`}
            className="text-primary text-sm font-medium underline"
          >
            Configurer mon entreprise →
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aucun client</CardTitle>
          <CardDescription>
            Ajoutez au moins un client avant de créer une facture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`/orgs/${params.orgSlug}/clients`}
            className="text-primary text-sm font-medium underline"
          >
            Gérer mes clients →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography variant="h1" className="text-2xl font-semibold">
          Nouvelle facture
        </Typography>
        <Typography variant="muted" className="text-sm">
          Facture conforme à la fiscalité de la Polynésie française.
        </Typography>
      </div>
      <InvoiceForm
        orgSlug={params.orgSlug}
        taxRegime={company.taxRegime as TaxRegime}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
