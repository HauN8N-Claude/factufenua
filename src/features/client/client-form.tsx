"use client";

import { Form, useForm } from "@/features/form/tanstack-form";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClientAction, updateClientAction } from "./client.action";
import {
  ClientFormSchema,
  type ClientFormSchemaType,
} from "./client.schema";

type ClientFormProps = {
  /** Présent => édition ; absent => création. */
  clientId?: string;
  defaultValues?: ClientFormSchemaType;
  onDone?: () => void;
};

const EMPTY: ClientFormSchemaType = {
  name: "",
  tahitiNumber: "",
  address: "",
};

export const ClientForm = ({
  clientId,
  defaultValues,
  onDone,
}: ClientFormProps) => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: ClientFormSchemaType) => {
      if (clientId) {
        return resolveActionResult(
          updateClientAction({ ...values, id: clientId }),
        );
      }
      return resolveActionResult(createClientAction(values));
    },
    onSuccess: () => {
      toast.success(clientId ? "Client mis à jour." : "Client ajouté.");
      router.refresh();
      onDone?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    schema: ClientFormSchema,
    defaultValues: defaultValues ?? EMPTY,
    onSubmit: async (values) => {
      await mutation.mutateAsync(values);
    },
  });

  return (
    <Form form={form} className="flex flex-col gap-4">
      <form.AppField name="name">
        {(field) => (
          <field.Field>
            <field.Label>Nom / raison sociale</field.Label>
            <field.Content>
              <field.Input placeholder="Ex. Pension Tiare" />
              <field.Message />
            </field.Content>
          </field.Field>
        )}
      </form.AppField>

      <form.AppField name="tahitiNumber">
        {(field) => (
          <field.Field>
            <field.Label>Numéro TAHITI (optionnel)</field.Label>
            <field.Content>
              <field.Input placeholder="Ex. T12345" />
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
              <field.Textarea placeholder="Adresse du client" />
              <field.Message />
            </field.Content>
          </field.Field>
        )}
      </form.AppField>

      <form.SubmitButton className="w-fit">
        {clientId ? "Enregistrer" : "Ajouter le client"}
      </form.SubmitButton>
    </Form>
  );
};
