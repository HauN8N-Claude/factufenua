import {
  cpsRateSchema,
  discountPercentSchema,
  priceInputModeSchema,
  tahitiNumberSchema,
  taxRegimeSchema,
  vatRateSchema,
} from "@/lib/tax/pf";
import { z } from "zod";

/**
 * Générateur de facture PUBLIC (sans compte, sans base).
 * Toutes les données sont fournies par l'utilisateur à chaque génération.
 */

export const PublicEmitterSchema = z.object({
  name: z.string().min(1, "Raison sociale requise."),
  tahitiNumber: tahitiNumberSchema,
  address: z.string().min(1, "Adresse requise."),
  phone: z.string().optional().or(z.literal("")),
  taxRegime: taxRegimeSchema,
  /** Logo encodé en data URL (data:image/...;base64,...). Optionnel. */
  logoDataUrl: z.string().startsWith("data:image/").optional().or(z.literal("")),
});

export const PublicClientSchema = z.object({
  name: z.string().min(1, "Nom du client requis."),
  tahitiNumber: z
    .string()
    .regex(/^[A-Z]\d{5}$/, "Numéro TAHITI invalide (format : T12345).")
    .optional()
    .or(z.literal("")),
  address: z.string().min(1, "Adresse du client requise."),
});

export const PublicInvoiceLineSchema = z.object({
  description: z.string().min(1, "Description requise."),
  quantity: z.coerce.number().positive("Quantité invalide."),
  unitPrice: z.coerce.number().nonnegative("Prix invalide."),
  priceInputMode: priceInputModeSchema,
  vatRate: z.coerce.number().pipe(vatRateSchema),
  discountPercent: z.coerce.number().pipe(discountPercentSchema).optional(),
  cpsRate: z.coerce.number().pipe(cpsRateSchema).optional(),
  dateOperation: z.string().optional(),
});

export const PublicInvoiceSchema = z.object({
  emitter: PublicEmitterSchema,
  client: PublicClientSchema,
  number: z.string().min(1, "Numéro de facture requis."),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  lines: z.array(PublicInvoiceLineSchema).min(1, "Au moins une ligne."),
});

export type PublicEmitterType = z.infer<typeof PublicEmitterSchema>;
export type PublicInvoiceType = z.infer<typeof PublicInvoiceSchema>;
