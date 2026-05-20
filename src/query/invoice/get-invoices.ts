import { prisma } from "@/lib/prisma";

/** Liste les factures d'une organisation (scoping sécurité par organizationId). */
export const getInvoices = async (organizationId: string) => {
  return prisma.invoice.findMany({
    where: { organizationId },
    select: {
      id: true,
      number: true,
      issueDate: true,
      status: true,
      currency: true,
      client: { select: { name: true } },
      lines: {
        select: { quantity: true, unitPriceHT: true, vatRate: true },
      },
    },
    orderBy: { issueDate: "desc" },
  });
};

export type InvoiceListItem = Awaited<
  ReturnType<typeof getInvoices>
>[number];
