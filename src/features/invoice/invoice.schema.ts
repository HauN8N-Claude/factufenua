import { priceInputModeSchema, vatRateSchema } from "@/lib/tax/pf";
import { z } from "zod";

/**
 * Saisie d'une ligne de facture par l'utilisateur.
 * Le taux de TVA est validé contre les taux PF autorisés (moteur fiscal).
 */
export const InvoiceLineFormSchema = z.object({
  description: z.string().min(1, "Description requise."),
  quantity: z.coerce.number().positive("La quantité doit être positive."),
  unitPrice: z.coerce
    .number()
    .nonnegative("Le prix unitaire doit être positif."),
  priceInputMode: priceInputModeSchema,
  vatRate: z.coerce.number().pipe(vatRateSchema),
});

export const InvoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client requis."),
  issueDate: z.coerce.date(),
  lines: z
    .array(InvoiceLineFormSchema)
    .min(1, "Au moins une ligne est requise."),
});

export type InvoiceLineFormType = z.infer<typeof InvoiceLineFormSchema>;
export type InvoiceFormType = z.infer<typeof InvoiceFormSchema>;

export const InvoiceStatusUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PAID", "UNPAID"]),
});
