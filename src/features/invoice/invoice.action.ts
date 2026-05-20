"use server";

import { orgAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { computeInvoice, type TaxRegime } from "@/lib/tax/pf";
import {
  InvoiceFormSchema,
  InvoiceStatusUpdateSchema,
} from "./invoice.schema";

/** Format du numéro de facture : AAAA-NNNN (séquence continue, sans trou). */
function formatInvoiceNumber(issueDate: Date, seq: number): string {
  return `${issueDate.getFullYear()}-${String(seq).padStart(4, "0")}`;
}

export const createInvoiceAction = orgAction
  .metadata({})
  .schema(InvoiceFormSchema)
  .action(async ({ parsedInput, ctx: { org } }) => {
    // 1. Entreprise émettrice (prérequis) + snapshot du régime fiscal (ADR-001)
    const company = await prisma.company.findUnique({
      where: { organizationId: org.id },
      select: { id: true, taxRegime: true },
    });
    if (!company) {
      throw new ActionError(
        "Renseignez d'abord le profil de votre entreprise (Mon entreprise).",
      );
    }

    // 2. Le client doit appartenir à l'organisation (scoping sécurité)
    const client = await prisma.client.findFirst({
      where: { id: parsedInput.clientId, organizationId: org.id },
      select: { id: true },
    });
    if (!client) {
      throw new ActionError("Client introuvable.");
    }

    // 3. Calcul fiscal via le moteur testé (jamais de calcul ad hoc)
    const taxRegime = company.taxRegime as TaxRegime;
    const computed = computeInvoice({
      taxRegime,
      lines: parsedInput.lines,
    });

    // 4. Numérotation séquentielle + création dans UNE transaction (ADR-003)
    const invoice = await prisma.$transaction(async (tx) => {
      const updatedCompany = await tx.company.update({
        where: { id: company.id },
        data: { invoiceSeq: { increment: 1 } },
        select: { invoiceSeq: true },
      });

      const number = formatInvoiceNumber(
        parsedInput.issueDate,
        updatedCompany.invoiceSeq,
      );

      return tx.invoice.create({
        data: {
          organizationId: org.id,
          companyId: company.id,
          clientId: client.id,
          number,
          issueDate: parsedInput.issueDate,
          status: "UNPAID",
          taxRegime, // snapshot figé à l'émission
          currency: "XPF",
          lines: {
            create: computed.lines.map((line) => ({
              description: line.description,
              quantity: line.quantity,
              priceInputMode: line.priceInputMode,
              unitPriceHT: line.unitPriceHT, // valeur canonique
              vatRate: line.vatRate, // snapshot du taux
            })),
          },
        },
        select: { id: true, number: true },
      });
    });

    return {
      id: invoice.id,
      number: invoice.number,
      totalTTC: computed.totalTTC,
    };
  });

/** Bascule le statut payé / impayé. La facture reste immuable par ailleurs. */
export const setInvoiceStatusAction = orgAction
  .metadata({})
  .schema(InvoiceStatusUpdateSchema)
  .action(async ({ parsedInput, ctx: { org } }) => {
    const result = await prisma.invoice.updateMany({
      where: { id: parsedInput.id, organizationId: org.id },
      data: { status: parsedInput.status },
    });
    if (result.count === 0) {
      throw new ActionError("Facture introuvable.");
    }
    return { id: parsedInput.id, status: parsedInput.status };
  });
