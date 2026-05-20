import { Typography } from "@/components/nowts/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { Building2, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function Page(props: PageProps<"/orgs/[orgSlug]">) {
  return (
    <Suspense fallback={null}>
      <RoutePage {...props} />
    </Suspense>
  );
}

async function RoutePage(props: PageProps<"/orgs/[orgSlug]">) {
  const params = await props.params;
  const { id: orgId } = await getRequiredCurrentOrgCache();

  const [company, clientCount] = await Promise.all([
    prisma.company.findUnique({
      where: { organizationId: orgId },
      select: { name: true, tahitiNumber: true, taxRegime: true },
    }),
    prisma.client.count({ where: { organizationId: orgId } }),
  ]);

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Tableau de bord</LayoutTitle>
      </LayoutHeader>
      <LayoutContent className="flex flex-col gap-6">
        {!company ? (
          <Card>
            <CardHeader>
              <CardTitle>Bienvenue sur FactuFenua</CardTitle>
              <CardDescription>
                Première étape : renseignez votre entreprise pour pouvoir créer
                des factures conformes.
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
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{company.name}</CardTitle>
              <CardDescription>
                Numéro TAHITI : {company.tahitiNumber} ·{" "}
                {company.taxRegime === "FRANCHISE"
                  ? "Franchise en base de TVA"
                  : "Assujetti à la TVA"}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href={`/orgs/${params.orgSlug}/company`}>
            <Card className="hover:bg-accent h-full transition-colors">
              <CardHeader>
                <Building2 className="text-primary size-6" />
                <CardTitle className="mt-3">Mon entreprise</CardTitle>
                <CardDescription>
                  Identité, numéro TAHITI et régime fiscal — réutilisés sur
                  chaque facture.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href={`/orgs/${params.orgSlug}/clients`}>
            <Card className="hover:bg-accent h-full transition-colors">
              <CardHeader>
                <Users className="text-primary size-6" />
                <CardTitle className="mt-3">
                  Clients ({clientCount})
                </CardTitle>
                <CardDescription>
                  Votre carnet de clients réutilisables.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <Typography variant="muted" className="text-sm">
          La création de factures arrive prochainement (en cours de
          développement).
        </Typography>
      </LayoutContent>
    </Layout>
  );
}
