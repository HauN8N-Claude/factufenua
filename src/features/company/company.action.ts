"use server";

import { orgAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { CompanyFormSchema } from "./company.schema";

/**
 * Crée ou met à jour le profil entreprise de l'organisation courante.
 * Scoping de sécurité : `organizationId` provient de `ctx.org` (membership
 * validée par orgAction), jamais du client.
 */
export const upsertCompanyAction = orgAction
  .metadata({})
  .schema(CompanyFormSchema)
  .action(async ({ parsedInput, ctx: { org } }) => {
    const data = {
      name: parsedInput.name,
      tahitiNumber: parsedInput.tahitiNumber,
      address: parsedInput.address,
      logoUrl: parsedInput.logoUrl ? parsedInput.logoUrl : null,
      taxRegime: parsedInput.taxRegime,
    };

    const company = await prisma.company.upsert({
      where: { organizationId: org.id },
      create: { organizationId: org.id, ...data },
      update: data,
      select: { id: true },
    });

    return { id: company.id };
  });
