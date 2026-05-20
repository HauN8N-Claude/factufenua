"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { computeInvoice } from "@/lib/tax/pf";
import type { InvoiceListItem } from "@/query/invoice/get-invoices";
import { useMutation } from "@tanstack/react-query";
import { Check, Download, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setInvoiceStatusAction } from "./invoice.action";

type InvoiceListProps = {
  invoices: InvoiceListItem[];
};

const fmtXpf = (n: number) =>
  `${new Intl.NumberFormat("fr-FR").format(n)} XPF`;

const totalTTC = (inv: InvoiceListItem) => {
  try {
    const r = computeInvoice({
      taxRegime: "ASSUJETTI_TVA", // taux déjà figés (0 si franchise)
      lines: inv.lines.map((l) => ({
        description: "x",
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPriceHT),
        priceInputMode: "HT" as const,
        vatRate: Number(l.vatRate),
      })),
    });
    return r.totalTTC;
  } catch {
    return 0;
  }
};

export const InvoiceList = ({ invoices }: InvoiceListProps) => {
  const router = useRouter();

  const statusMutation = useMutation({
    mutationFn: async (vars: { id: string; status: "PAID" | "UNPAID" }) =>
      resolveActionResult(setInvoiceStatusAction(vars)),
    onSuccess: () => {
      toast.success("Statut mis à jour.");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <p className="text-muted-foreground text-sm">
            Aucune facture pour l'instant. Créez votre première facture.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes factures ({invoices.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {inv.number} · {inv.client.name}
                </span>
                <span className="text-muted-foreground text-sm">
                  {new Date(inv.issueDate).toLocaleDateString("fr-FR")} ·{" "}
                  {fmtXpf(totalTTC(inv))} ·{" "}
                  {inv.status === "PAID" ? "Payée" : "Impayée"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    statusMutation.mutate({
                      id: inv.id,
                      status: inv.status === "PAID" ? "UNPAID" : "PAID",
                    })
                  }
                >
                  {inv.status === "PAID" ? (
                    <>
                      <RotateCcw className="size-4" /> Impayée
                    </>
                  ) : (
                    <>
                      <Check className="size-4" /> Payée
                    </>
                  )}
                </Button>
                <Link
                  href={`/api/invoices/${inv.id}/pdf`}
                  target="_blank"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm">
                    <Download className="size-4" /> PDF
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
