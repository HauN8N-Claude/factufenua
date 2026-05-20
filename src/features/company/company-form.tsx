"use client";

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
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertCompanyAction } from "./company.action";
import {
  CompanyFormSchema,
  type CompanyFormSchemaType,
} from "./company.schema";

type CompanyFormProps = {
  defaultValues: CompanyFormSchemaType;
};

export const CompanyForm = ({ defaultValues }: CompanyFormProps) => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: CompanyFormSchemaType) =>
      resolveActionResult(upsertCompanyAction(values)),
    onSuccess: () => {
      toast.success("Profil entreprise enregistré.");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    schema: CompanyFormSchema,
    defaultValues,
    onSubmit: async (values) => {
      await mutation.mutateAsync(values);
    },
  });

  return (
    <Form form={form}>
      <div className="flex w-full flex-col gap-6 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Identité de l'entreprise</CardTitle>
            <CardDescription>
              Ces informations apparaissent comme émetteur sur toutes vos
              factures (mentions légales obligatoires en Polynésie française).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form.AppField name="name">
              {(field) => (
                <field.Field>
                  <field.Label>Raison sociale</field.Label>
                  <field.Content>
                    <field.Input placeholder="Ex. Teva Services" />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>

            <form.AppField name="tahitiNumber">
              {(field) => (
                <field.Field>
                  <field.Label>Numéro TAHITI</field.Label>
                  <field.Content>
                    <field.Input placeholder="Ex. T12345" />
                    <field.Description>
                      Identifiant fiscal ISPF — 1 lettre + 5 chiffres.
                      Obligatoire sur les factures (art. LP. 344-5).
                    </field.Description>
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>

            <form.AppField name="address">
              {(field) => (
                <field.Field>
                  <field.Label>Adresse</field.Label>
                  <field.Content>
                    <field.Textarea placeholder="Adresse complète en Polynésie française" />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>

            <form.AppField name="logoUrl">
              {(field) => (
                <field.Field>
                  <field.Label>Logo (URL, optionnel)</field.Label>
                  <field.Content>
                    <field.Input placeholder="https://..." />
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Régime fiscal</CardTitle>
            <CardDescription>
              Franchise en base si votre chiffre d'affaires annuel est inférieur
              ou égal à 5 000 000 XPF (aucune TVA facturée, mention légale
              automatique). Sinon, assujetti à la TVA polynésienne.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppField name="taxRegime">
              {(field) => (
                <field.Field>
                  <field.Content>
                    <field.Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un régime" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRANCHISE">
                          Franchise en base (≤ 5 000 000 XPF/an)
                        </SelectItem>
                        <SelectItem value="ASSUJETTI_TVA">
                          Assujetti à la TVA
                        </SelectItem>
                      </SelectContent>
                    </field.Select>
                    <field.Message />
                  </field.Content>
                </field.Field>
              )}
            </form.AppField>
          </CardContent>
        </Card>

        <Card className="flex items-end p-6">
          <form.SubmitButton className="w-fit">Enregistrer</form.SubmitButton>
        </Card>
      </div>
    </Form>
  );
};
