import { CompanyForm } from "@/features/company/company-form";
import type { CompanyFormSchemaType } from "@/features/company/company.schema";
import { prisma } from "@/lib/prisma";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
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

  const company = await prisma.company.findUnique({
    where: { organizationId: orgId },
    select: {
      name: true,
      tahitiNumber: true,
      address: true,
      logoUrl: true,
      taxRegime: true,
    },
  });

  const defaultValues: CompanyFormSchemaType = {
    name: company?.name ?? "",
    tahitiNumber: company?.tahitiNumber ?? "",
    address: company?.address ?? "",
    logoUrl: company?.logoUrl ?? "",
    taxRegime:
      // Code en sommeil (premium futur) — le cast force le type mais on
      // garde le fallback runtime au cas où la DB renvoie une valeur null.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (company?.taxRegime as CompanyFormSchemaType["taxRegime"]) ?? "FRANCHISE",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Mon entreprise</h1>
        <p className="text-muted-foreground text-sm">
          Renseignez votre entreprise une fois : ces informations préremplissent
          l'émetteur de chaque facture.
        </p>
      </div>
      <CompanyForm defaultValues={defaultValues} />
    </div>
  );
}
