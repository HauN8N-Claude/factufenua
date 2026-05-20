import { z } from "zod";

/**
 * Moteur fiscal — Polynésie française (PF)
 *
 * ⚠️ SOURCE DE VÉRITÉ RÉGLEMENTAIRE — module pur, déterministe, testé.
 * Une erreur ici = facture client erronée. Toute modification DOIT être
 * accompagnée de tests et idéalement validée par un expert-comptable PF.
 *
 * Données confirmées par la DICP (Direction des Impôts et des Contributions
 * Publiques de Polynésie française) — vérifiées le 2026-05-19.
 * Sources : voir docs/conformite-pf.md (Task 12).
 *
 * Devise : Franc Pacifique (XPF / F CFP) — SANS sous-unité (montants entiers).
 */

// ---------------------------------------------------------------------------
// Table des taux de TVA — VERSIONNÉE (date d'effet pour traçabilité, ADR-001)
// ---------------------------------------------------------------------------

/** Date d'effet de la table de taux ci-dessous (dernière modif DICP connue). */
export const PF_VAT_TABLE_EFFECTIVE_DATE = "2025-02-08";

/**
 * Taux de TVA polynésiens en vigueur.
 * - REDUIT 5 %        : produits alimentaires, transport de voyageurs,
 *                       électricité, hébergement hôtelier
 * - INTERMEDIAIRE 13 %: prestations de services non réduites/exonérées
 * - NORMAL 16 %       : produits (notamment importés)
 * - EXONERE 0 %       : franchise en base / opérations exonérées
 *
 * NB : un éventuel taux à 1 % évoqué par certaines sources N'EST PAS intégré
 * tant qu'il n'est pas confirmé dans le Code des impôts (art. LP.338+).
 * Voir Task 12 (vérification lexpol.cloud.pf).
 */
export const PF_VAT_RATES = {
  EXONERE: 0,
  REDUIT: 0.05,
  INTERMEDIAIRE: 0.13,
  NORMAL: 0.16,
} as const;

export type PfVatRateKey = keyof typeof PF_VAT_RATES;

/** Ensemble des taux numériques autorisés (validation stricte). */
export const PF_ALLOWED_VAT_RATES: readonly number[] = Object.values(
  PF_VAT_RATES,
);

/**
 * Taux de CPS (Contribution Pour la Solidarité) figurant sur certaines
 * factures en PF — généralement 0 ou 1 %.
 * ⚠️ Cadre exact à confirmer avec un expert-comptable PF (Task 12).
 */
export const PF_CPS_RATES = {
  ZERO: 0,
  STANDARD: 0.01,
} as const;

export const PF_ALLOWED_CPS_RATES: readonly number[] = [0, 0.01];

// ---------------------------------------------------------------------------
// Constantes monétaires & seuils
// ---------------------------------------------------------------------------

/** Parité fixe et irrévocable garantie par l'IEOM : 1 EUR = 119,3317 XPF. */
export const EUR_XPF = 119.3317;

/**
 * Seuil de la franchise en base de TVA : CA annuel ≤ 5 000 000 XPF →
 * l'entreprise ne facture pas la TVA (régime FRANCHISE).
 */
export const FRANCHISE_THRESHOLD_XPF = 5_000_000;

/** Mention légale obligatoire sur les factures en franchise en base. */
export const FRANCHISE_LEGAL_MENTION =
  "TVA non applicable — article LP. 333-1 du Code des impôts de la Polynésie française";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Régime fiscal de l'émetteur (figé sur la facture à l'émission — ADR-001). */
export type TaxRegime = "FRANCHISE" | "ASSUJETTI_TVA";

/** Mode de saisie du prix d'une ligne par l'utilisateur. */
export type PriceInputMode = "HT" | "TTC";

export type InvoiceLineInput = {
  /** Libellé de la prestation / du bien. */
  description: string;
  /** Quantité (peut être décimale, ex. heures). */
  quantity: number;
  /** Prix unitaire tel que saisi par l'utilisateur (en XPF). */
  unitPrice: number;
  /** Indique si `unitPrice` est exprimé HT ou TTC. */
  priceInputMode: PriceInputMode;
  /** Taux de TVA applicable à la ligne (0 / 0.05 / 0.13 / 0.16). */
  vatRate: number;
  /** Remise en pourcentage (0–100). Optionnel, 0 par défaut. */
  discountPercent?: number;
  /** Taux CPS appliqué à la ligne (0 ou 0.01). Optionnel, 0 par défaut. */
  cpsRate?: number;
  /** Date de l'opération (affichage uniquement, format ISO ou libre). */
  dateOperation?: string;
};

export type InvoiceComputeInput = {
  /** Régime fiscal de l'émetteur. En FRANCHISE, la TVA est forcée à 0. */
  taxRegime: TaxRegime;
  lines: InvoiceLineInput[];
};

/** Détail des totaux pour un taux de TVA donné. */
export type VatBucket = {
  vatRate: number;
  baseHT: number;
  vatAmount: number;
};

/** Détail des totaux pour un taux de CPS donné. */
export type CpsBucket = {
  cpsRate: number;
  baseHT: number;
  cpsAmount: number;
};

export type InvoiceComputeResult = {
  /** Lignes enrichies : HT canonique calculé + total ligne HT (après remise). */
  lines: (InvoiceLineInput & { unitPriceHT: number; lineTotalHT: number })[];
  /** Décomposition par taux de TVA (exigée par l'art. LP.344-5). */
  vatBuckets: VatBucket[];
  /** Décomposition par taux de CPS (0 / 1 %). */
  cpsBuckets: CpsBucket[];
  totalHT: number;
  totalVAT: number;
  totalCPS: number;
  /** TTC = HT + TVA + CPS. */
  totalTTC: number;
  /** Mention légale à afficher (franchise) ou null. */
  legalMention: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Arrondi monétaire XPF : le Franc Pacifique n'a pas de sous-unité, tous les
 * montants sont des ENTIERS. Arrondi au plus proche, demi vers le haut
 * (Math.round). Règle documentée et testée — ne pas changer sans validation.
 */
export function roundXpf(value: number): number {
  return Math.round(value);
}

/** Convertit un prix TTC en HT pour un taux donné : HT = TTC / (1 + taux). */
export function convertTtcToHt(unitPriceTtc: number, vatRate: number): number {
  if (vatRate < 0) {
    throw new Error(`Taux de TVA invalide : ${vatRate}`);
  }
  return roundXpf(unitPriceTtc / (1 + vatRate));
}

/** EUR → XPF (parité fixe IEOM), arrondi XPF. */
export function eurToXpf(amountEur: number): number {
  return roundXpf(amountEur * EUR_XPF);
}

/** XPF → EUR (parité fixe IEOM), 2 décimales. */
export function xpfToEur(amountXpf: number): number {
  return Math.round((amountXpf / EUR_XPF) * 100) / 100;
}

/**
 * Valide un numéro TAHITI : 1 lettre majuscule + 5 chiffres (ex. T12345).
 * Identifiant fiscal attribué par l'ISPF, obligatoire sur les factures.
 */
export function isValidTahitiNumber(value: string): boolean {
  return /^[A-Z]\d{5}$/.test(value);
}

/** Indique si un CA annuel (XPF) place l'entreprise sous la franchise TVA. */
export function isUnderVatFranchiseThreshold(annualRevenueXpf: number): boolean {
  return annualRevenueXpf <= FRANCHISE_THRESHOLD_XPF;
}

// ---------------------------------------------------------------------------
// Calcul principal d'une facture
// ---------------------------------------------------------------------------

/**
 * Calcule les totaux d'une facture conformément au régime fiscal PF.
 *
 * Règles :
 * - Régime FRANCHISE → tous les taux forcés à 0, mention légale ajoutée.
 * - Régime ASSUJETTI → chaque `vatRate` doit appartenir à PF_ALLOWED_VAT_RATES.
 * - HT canonique : si saisie TTC, HT = round(TTC / (1 + taux)).
 * - Arrondi à chaque ligne (HT), puis TVA arrondie par bucket de taux.
 */
export function computeInvoice(
  input: InvoiceComputeInput,
): InvoiceComputeResult {
  const isFranchise = input.taxRegime === "FRANCHISE";

  if (input.lines.length === 0) {
    throw new Error("Une facture doit contenir au moins une ligne.");
  }

  const enrichedLines = input.lines.map((line) => {
    if (line.quantity <= 0) {
      throw new Error(
        `Quantité invalide pour la ligne "${line.description}" : ${line.quantity}`,
      );
    }
    if (line.unitPrice < 0) {
      throw new Error(
        `Prix unitaire négatif pour la ligne "${line.description}".`,
      );
    }

    const effectiveRate = isFranchise ? 0 : line.vatRate;

    if (!isFranchise && !PF_ALLOWED_VAT_RATES.includes(effectiveRate)) {
      throw new Error(
        `Taux de TVA non autorisé en PF : ${line.vatRate}. ` +
          `Taux valides : ${PF_ALLOWED_VAT_RATES.join(", ")}.`,
      );
    }

    const discountPercent = line.discountPercent ?? 0;
    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error(
        `Remise invalide (0 à 100 %) : ${discountPercent}`,
      );
    }

    const cpsRate = line.cpsRate ?? 0;
    if (!PF_ALLOWED_CPS_RATES.includes(cpsRate)) {
      throw new Error(
        `Taux CPS non autorisé : ${cpsRate}. ` +
          `Taux valides : ${PF_ALLOWED_CPS_RATES.join(", ")}.`,
      );
    }

    const unitPriceHT =
      line.priceInputMode === "TTC"
        ? convertTtcToHt(line.unitPrice, effectiveRate)
        : roundXpf(line.unitPrice);

    const grossLineHT = unitPriceHT * line.quantity;
    const lineTotalHT = roundXpf(grossLineHT * (1 - discountPercent / 100));

    return {
      ...line,
      vatRate: effectiveRate,
      discountPercent,
      cpsRate,
      unitPriceHT,
      lineTotalHT,
    };
  });

  // Regroupement par taux de TVA (décomposition légale art. LP.344-5)
  const vatMap = new Map<number, number>();
  for (const line of enrichedLines) {
    vatMap.set(
      line.vatRate,
      (vatMap.get(line.vatRate) ?? 0) + line.lineTotalHT,
    );
  }
  const vatBuckets: VatBucket[] = [...vatMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([vatRate, baseHT]) => ({
      vatRate,
      baseHT,
      vatAmount: roundXpf(baseHT * vatRate),
    }));

  // Regroupement par taux de CPS
  const cpsMap = new Map<number, number>();
  for (const line of enrichedLines) {
    cpsMap.set(
      line.cpsRate,
      (cpsMap.get(line.cpsRate) ?? 0) + line.lineTotalHT,
    );
  }
  const cpsBuckets: CpsBucket[] = [...cpsMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([cpsRate, baseHT]) => ({
      cpsRate,
      baseHT,
      cpsAmount: roundXpf(baseHT * cpsRate),
    }));

  const totalHT = vatBuckets.reduce((sum, b) => sum + b.baseHT, 0);
  const totalVAT = vatBuckets.reduce((sum, b) => sum + b.vatAmount, 0);
  const totalCPS = cpsBuckets.reduce((sum, b) => sum + b.cpsAmount, 0);
  const totalTTC = totalHT + totalVAT + totalCPS;

  return {
    lines: enrichedLines,
    vatBuckets,
    cpsBuckets,
    totalHT,
    totalVAT,
    totalCPS,
    totalTTC,
    legalMention: isFranchise ? FRANCHISE_LEGAL_MENTION : null,
  };
}

// ---------------------------------------------------------------------------
// Schémas Zod (réutilisables par les formulaires / server actions — Task 06/07)
// ---------------------------------------------------------------------------

export const tahitiNumberSchema = z
  .string()
  .regex(/^[A-Z]\d{5}$/, "Numéro TAHITI invalide (format attendu : T12345).");

export const taxRegimeSchema = z.enum(["FRANCHISE", "ASSUJETTI_TVA"]);

export const priceInputModeSchema = z.enum(["HT", "TTC"]);

export const vatRateSchema = z
  .number()
  .refine((r) => PF_ALLOWED_VAT_RATES.includes(r), {
    message: `Taux de TVA non autorisé en PF (valides : ${PF_ALLOWED_VAT_RATES.join(", ")}).`,
  });

export const cpsRateSchema = z
  .number()
  .refine((r) => PF_ALLOWED_CPS_RATES.includes(r), {
    message: `Taux CPS non autorisé (valides : ${PF_ALLOWED_CPS_RATES.join(", ")}).`,
  });

export const discountPercentSchema = z.number().min(0).max(100);

export const invoiceLineInputSchema = z.object({
  description: z.string().min(1, "Description requise."),
  quantity: z.number().positive("La quantité doit être positive."),
  unitPrice: z.number().nonnegative("Le prix unitaire doit être positif."),
  priceInputMode: priceInputModeSchema,
  vatRate: vatRateSchema,
  discountPercent: discountPercentSchema.optional(),
  cpsRate: cpsRateSchema.optional(),
  dateOperation: z.string().optional(),
});

export const invoiceComputeInputSchema = z.object({
  taxRegime: taxRegimeSchema,
  lines: z.array(invoiceLineInputSchema).min(1, "Au moins une ligne requise."),
});
