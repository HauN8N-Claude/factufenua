import { prisma } from "@/lib/prisma";

/** Liste les clients d'une organisation (scoping de sécurité par organizationId). */
export const getClients = async (organizationId: string) => {
  return prisma.client.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      tahitiNumber: true,
      address: true,
      _count: { select: { invoices: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export type ClientListItem = Awaited<ReturnType<typeof getClients>>[number];
