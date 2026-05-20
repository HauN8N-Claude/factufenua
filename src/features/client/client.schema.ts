import { z } from "zod";

/**
 * Client (destinataire d'une facture). Le n° TAHITI est optionnel mais
 * recommandé (mention légale facture art. LP. 344-5 si le client en a un).
 */
export const ClientFormSchema = z.object({
  name: z.string().min(1, "Le nom du client est requis."),
  tahitiNumber: z
    .string()
    .regex(/^[A-Z]\d{5}$/, "Numéro TAHITI invalide (format : T12345).")
    .optional()
    .or(z.literal("")),
  address: z.string().min(1, "L'adresse est requise."),
});

export type ClientFormSchemaType = z.infer<typeof ClientFormSchema>;

export const ClientUpdateSchema = ClientFormSchema.extend({
  id: z.string().min(1),
});

export const ClientDeleteSchema = z.object({
  id: z.string().min(1),
});
