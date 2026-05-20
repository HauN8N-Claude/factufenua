import { tahitiNumberSchema, taxRegimeSchema } from "@/lib/tax/pf";
import { z } from "zod";

/**
 * Profil entreprise (émetteur des factures). Une entreprise par organisation.
 * Le n° TAHITI et le régime fiscal réutilisent les schémas du moteur fiscal
 * (source de vérité réglementaire — src/lib/tax/pf.ts).
 */
export const CompanyFormSchema = z.object({
  name: z.string().min(1, "La raison sociale est requise."),
  tahitiNumber: tahitiNumberSchema,
  address: z.string().min(1, "L'adresse est requise."),
  logoUrl: z
    .string()
    .url("URL de logo invalide.")
    .nullable()
    .optional()
    .or(z.literal("")),
  taxRegime: taxRegimeSchema,
});

export type CompanyFormSchemaType = z.infer<typeof CompanyFormSchema>;
