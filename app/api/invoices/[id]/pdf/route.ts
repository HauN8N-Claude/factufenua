import {
  InvoicePdfDocument,
  type InvoicePdfData,
} from "@/features/invoice/invoice-pdf-document";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { prisma } from "@/lib/prisma";
import { computeInvoice, type TaxRegime } from "@/lib/tax/pf";
import { authRoute } from "@/lib/zod-route";
import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";
import { z } from "zod";

export const GET = authRoute
  .params(z.object({ id: z.string() }))
  .handler(async (_req, { params, ctx }) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: {
        organizationId: true,
        number: true,
        issueDate: true,
        taxRegime: true,
        company: {
          select: { name: true, tahitiNumber: true, address: true },
        },
        client: {
          select: { name: true, tahitiNumber: true, address: true },
        },
        lines: {
          select: {
            description: true,
            quantity: true,
            unitPriceHT: true,
            vatRate: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new ZodRouteError("Facture introuvable.", 404);
    }

    // Contrôle d'accès : l'utilisateur doit être membre de l'organisation
    const membership = await prisma.member.findFirst({
      where: { organizationId: invoice.organizationId, userId: ctx.user.id },
      select: { id: true },
    });
    if (!membership) {
      throw new ZodRouteError("Accès refusé.", 404);
    }

    // Recalcul depuis les valeurs figées (taux déjà snapshotés, 0 si franchise)
    const computed = computeInvoice({
      taxRegime: invoice.taxRegime as TaxRegime,
      lines: invoice.lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPriceHT),
        priceInputMode: "HT" as const,
        vatRate: Number(l.vatRate),
      })),
    });

    const data: InvoicePdfData = {
      number: invoice.number,
      issueDate: invoice.issueDate,
      company: invoice.company,
      client: invoice.client,
      computed,
    };

    const buffer = await renderToBuffer(
      createElement(InvoicePdfDocument, { data }) as ReactElement<
        DocumentProps
      >,
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${invoice.number}.pdf"`,
      },
    });
  });
