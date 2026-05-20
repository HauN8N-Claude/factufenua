"use server";

import { orgAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import {
  ClientDeleteSchema,
  ClientFormSchema,
  ClientUpdateSchema,
} from "./client.schema";

/** Récupère la Company de l'org ou échoue (profil entreprise prérequis). */
async function getCompanyOrThrow(organizationId: string) {
  const company = await prisma.company.findUnique({
    where: { organizationId },
    select: { id: true },
  });
  if (!company) {
    throw new ActionError(
      "Renseignez d'abord le profil de votre entreprise (Mon entreprise).",
    );
  }
  return company;
}

const normalizeTahiti = (v?: string | null) => (v ? v : null);

export const createClientAction = orgAction
  .metadata({})
  .schema(ClientFormSchema)
  .action(async ({ parsedInput, ctx: { org } }) => {
    const company = await getCompanyOrThrow(org.id);
    const client = await prisma.client.create({
      data: {
        organizationId: org.id,
        companyId: company.id,
        name: parsedInput.name,
        tahitiNumber: normalizeTahiti(parsedInput.tahitiNumber),
        address: parsedInput.address,
      },
      select: { id: true },
    });
    return { id: client.id };
  });

export const updateClientAction = orgAction
  .metadata({})
  .schema(ClientUpdateSchema)
  .action(async ({ parsedInput, ctx: { org } }) => {
    // Scoping de sécurité : on ne met à jour que si le client appartient à l'org
    const result = await prisma.client.updateMany({
      where: { id: parsedInput.id, organizationId: org.id },
      data: {
        name: parsedInput.name,
        tahitiNumber: normalizeTahiti(parsedInput.tahitiNumber),
        address: parsedInput.address,
      },
    });
    if (result.count === 0) {
      throw new ActionError("Client introuvable.");
    }
    return { id: parsedInput.id };
  });

export const deleteClientAction = orgAction
  .metadata({})
  .schema(ClientDeleteSchema)
  .action(async ({ parsedInput, ctx: { org } }) => {
    const client = await prisma.client.findFirst({
      where: { id: parsedInput.id, organizationId: org.id },
      select: { id: true, _count: { select: { invoices: true } } },
    });
    if (!client) {
      throw new ActionError("Client introuvable.");
    }
    if (client._count.invoices > 0) {
      throw new ActionError(
        "Impossible de supprimer un client ayant des factures.",
      );
    }
    await prisma.client.delete({ where: { id: client.id } });
    return { id: client.id };
  });
