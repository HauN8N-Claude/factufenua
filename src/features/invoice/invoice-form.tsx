"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, useForm } from "@/features/form/tanstack-form";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { computeInvoice, type TaxRegime } from "@/lib/tax/pf";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { toast } from "sonner";
import { createInvoiceAction } from "./invoice.action";
import {
  InvoiceFormSchema,
  type InvoiceFormType,
} from "./invoice.schema";

type InvoiceFormProps = {
  orgSlug: string;
  taxRegime: TaxRegime;
  clients: { id: string; name: string }[];
};

const emptyLine = {
  description: "",
  quantity: 1,
  unitPrice: 0,
  priceInputMode: "HT" as const,
  vatRate: 0.13,
};

const fmtXpf = (n: number) =>
  `${new Intl.NumberFormat("fr-FR").format(n)} XPF`;

export const InvoiceForm = ({
  orgSlug,
  taxRegime,
  clients,
}: InvoiceFormProps) => {
  const router = useRouter();
  const isFranchise = taxRegime === "FRANCHISE";

  const mutation = useMutation({
    mutationFn: async (values: InvoiceFormType) =>
      resolveActionResult(createInvoiceAction(values)),
    onSuccess: (data) => {
      toast.success(`Facture ${data.number} créée.`);
      router.push(`/orgs/${orgSlug}/invoices`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    schema: InvoiceFormSchema,
    defaultValues: {
      clientId: "",
      issueDate: new Date(),
      lines: [emptyLine],
    } as InvoiceFormType,
    onSubmit: async (values) => {
      await mutation.mutateAsync(values);
    },
  });

  return (
    <Form form={form as unknown as ComponentProps<typeof Form>["form"]}>
      <div className="flex w-full flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Facture</CardTitle>
            <CardDescription>
              {isFranchise
                ? "Régime franchise en base : aucune TVA, mention légale ajoutée automatiquement."
                : "Régime assujetti : TVA polynésienne appliquée par taux."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form.AppField name="clientId">
              {(field) => (
                <field.Field>
                  <field.Label>Client</field.Label>
                  <field.Content>
                    <field.Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </field.Select>
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>

            <form.AppField name="issueDate">
              {(field) => (
                <field.Field>
                  <field.Label>Date de la facture</field.Label>
                  <field.Content>
                    <field.Input type="date" />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lignes</CardTitle>
            <CardDescription>
              Saisissez le prix en HT ou en TTC : le calcul s'ajuste.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form.Subscribe selector={(s) => s.values.lines}>
              {(lines) => (
                <div className="flex flex-col gap-6">
                  {lines.map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-3 border-b pb-4 last:border-b-0"
                    >
                      <form.AppField name={`lines[${i}].description`}>
                        {(field) => (
                          <field.Field>
                            <field.Label>Description</field.Label>
                            <field.Content>
                              <field.Input placeholder="Prestation / bien" />
                              <field.Message />
                            </field.Content>
                          </field.Field>
                        )}
                      </form.AppField>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <form.AppField name={`lines[${i}].quantity`}>
                          {(field) => (
                            <field.Field>
                              <field.Label>Quantité</field.Label>
                              <field.Content>
                                <field.Input type="number" step="any" />
                                <field.Message />
                              </field.Content>
                            </field.Field>
                          )}
                        </form.AppField>

                        <form.AppField name={`lines[${i}].unitPrice`}>
                          {(field) => (
                            <field.Field>
                              <field.Label>Prix unitaire (XPF)</field.Label>
                              <field.Content>
                                <field.Input type="number" step="any" />
                                <field.Message />
                              </field.Content>
                            </field.Field>
                          )}
                        </form.AppField>

                        <form.AppField name={`lines[${i}].priceInputMode`}>
                          {(field) => (
                            <field.Field>
                              <field.Label>Mode</field.Label>
                              <field.Content>
                                <field.Select>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="HT">HT</SelectItem>
                                    <SelectItem value="TTC">TTC</SelectItem>
                                  </SelectContent>
                                </field.Select>
                                <field.Message />
                              </field.Content>
                            </field.Field>
                          )}
                        </form.AppField>

                        <form.AppField name={`lines[${i}].vatRate`}>
                          {(field) => (
                            <field.Field>
                              <field.Label>TVA</field.Label>
                              <field.Content>
                                <field.Select disabled={isFranchise}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0 %</SelectItem>
                                    <SelectItem value="0.05">5 %</SelectItem>
                                    <SelectItem value="0.13">13 %</SelectItem>
                                    <SelectItem value="0.16">16 %</SelectItem>
                                  </SelectContent>
                                </field.Select>
                                <field.Message />
                              </field.Content>
                            </field.Field>
                          )}
                        </form.AppField>
                      </div>

                      {lines.length > 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={async () => form.removeFieldValue("lines", i)}
                        >
                          <Trash2 className="size-4" /> Retirer
                        </Button>
                      ) : null}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => form.pushFieldValue("lines", emptyLine)}
                  >
                    <Plus className="size-4" /> Ajouter une ligne
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
          </CardHeader>
          <CardContent>
            <form.Subscribe selector={(s) => s.values.lines}>
              {(lines) => {
                try {
                  const r = computeInvoice({
                    taxRegime,
                    lines: lines.map((l) => ({
                      // Code en sommeil (premium futur).
                      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                      description: String(l.description ?? ""),
                      quantity: Number(l.quantity) || 0,
                      unitPrice: Number(l.unitPrice) || 0,
                      priceInputMode:
                        l.priceInputMode === "TTC" ? "TTC" : "HT",
                      vatRate: Number(l.vatRate) || 0,
                    })),
                  });
                  return (
                    <div className="flex flex-col gap-1 text-sm">
                      {r.vatBuckets.map((b) => (
                        <div
                          key={b.vatRate}
                          className="text-muted-foreground flex justify-between"
                        >
                          <span>
                            Base HT {Math.round(b.vatRate * 100)} %
                          </span>
                          <span>{fmtXpf(b.baseHT)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <span>Total HT</span>
                        <span>{fmtXpf(r.totalHT)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA</span>
                        <span>{fmtXpf(r.totalVAT)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total TTC</span>
                        <span>{fmtXpf(r.totalTTC)}</span>
                      </div>
                      {r.legalMention ? (
                        <p className="text-muted-foreground mt-2 text-xs">
                          {r.legalMention}
                        </p>
                      ) : null}
                    </div>
                  );
                } catch {
                  return (
                    <p className="text-muted-foreground text-sm">
                      Complétez les lignes pour voir l'aperçu.
                    </p>
                  );
                }
              }}
            </form.Subscribe>
          </CardContent>
        </Card>

        <Card className="flex items-end p-6">
          <form.SubmitButton className="w-fit">
            Créer la facture
          </form.SubmitButton>
        </Card>
      </div>
    </Form>
  );
};
