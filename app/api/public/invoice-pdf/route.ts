import {
  InvoicePdfDocument,
  type InvoicePdfData,
} from "@/features/invoice/invoice-pdf-document";
import { PublicInvoiceSchema } from "@/features/public-invoice/public-invoice.schema";
import { computeInvoice } from "@/lib/tax/pf";
import { route } from "@/lib/zod-route";
import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createElement, type ReactElement } from "react";

/**
 * Génération PUBLIQUE d'un PDF de facture conforme PF.
 * Aucune authentification, aucune persistance : toutes les données viennent
 * du corps de la requête. Le PDF est rendu à la volée.
 */
export const POST = route
  .body(PublicInvoiceSchema)
  .handler(async (_req, { body }) => {
    const computed = computeInvoice({
      taxRegime: body.emitter.taxRegime,
      lines: body.lines,
    });

    const data: InvoicePdfData = {
      number: body.number,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      company: {
        name: body.emitter.name,
        tahitiNumber: body.emitter.tahitiNumber,
        address: body.emitter.address,
        phone: body.emitter.phone || null,
        logoDataUrl: body.emitter.logoDataUrl || null,
      },
      client: {
        name: body.client.name,
        tahitiNumber: body.client.tahitiNumber
          ? body.client.tahitiNumber
          : null,
        address: body.client.address,
      },
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
        "Content-Disposition": `inline; filename="facture-${body.number}.pdf"`,
      },
    });
  });
