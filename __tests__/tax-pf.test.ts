import {
  computeInvoice,
  convertTtcToHt,
  EUR_XPF,
  eurToXpf,
  FRANCHISE_LEGAL_MENTION,
  FRANCHISE_THRESHOLD_XPF,
  invoiceComputeInputSchema,
  isUnderVatFranchiseThreshold,
  isValidTahitiNumber,
  PF_ALLOWED_VAT_RATES,
  PF_VAT_RATES,
  roundXpf,
  xpfToEur,
} from "@/lib/tax/pf";
import { describe, expect, it } from "vitest";

describe("Moteur fiscal PF", () => {
  describe("Constantes réglementaires", () => {
    it("expose les taux de TVA confirmés DICP", () => {
      expect(PF_VAT_RATES.EXONERE).toBe(0);
      expect(PF_VAT_RATES.REDUIT).toBe(0.05);
      expect(PF_VAT_RATES.INTERMEDIAIRE).toBe(0.13);
      expect(PF_VAT_RATES.NORMAL).toBe(0.16);
    });

    it("n'autorise pas de taux 1 % (non confirmé)", () => {
      expect(PF_ALLOWED_VAT_RATES).not.toContain(0.01);
    });

    it("a la parité fixe IEOM", () => {
      expect(EUR_XPF).toBe(119.3317);
    });

    it("a le seuil de franchise à 5 000 000 XPF", () => {
      expect(FRANCHISE_THRESHOLD_XPF).toBe(5_000_000);
    });
  });

  describe("roundXpf (Franc Pacifique sans sous-unité)", () => {
    it("arrondit à l'entier le plus proche", () => {
      expect(roundXpf(1190.4)).toBe(1190);
      expect(roundXpf(1190.5)).toBe(1191);
      expect(roundXpf(1190)).toBe(1190);
    });
  });

  describe("convertTtcToHt", () => {
    it("retrouve le HT depuis un TTC au taux normal 16 %", () => {
      // 11600 TTC à 16 % → 10000 HT
      expect(convertTtcToHt(11600, 0.16)).toBe(10000);
    });

    it("retrouve le HT au taux intermédiaire 13 %", () => {
      expect(convertTtcToHt(11300, 0.13)).toBe(10000);
    });

    it("retourne le TTC tel quel si taux 0 (franchise/exonéré)", () => {
      expect(convertTtcToHt(5000, 0)).toBe(5000);
    });

    it("rejette un taux négatif", () => {
      expect(() => convertTtcToHt(1000, -0.1)).toThrow();
    });
  });

  describe("Conversions EUR ⇄ XPF (parité fixe)", () => {
    it("convertit EUR → XPF", () => {
      expect(eurToXpf(1)).toBe(119);
      expect(eurToXpf(100)).toBe(11933);
    });

    it("convertit XPF → EUR (2 décimales)", () => {
      expect(xpfToEur(119331.7)).toBeCloseTo(1000, 1);
    });
  });

  describe("isValidTahitiNumber", () => {
    it("accepte un numéro valide (1 lettre + 5 chiffres)", () => {
      expect(isValidTahitiNumber("T12345")).toBe(true);
      expect(isValidTahitiNumber("A00001")).toBe(true);
    });

    it("rejette les formats invalides", () => {
      expect(isValidTahitiNumber("t12345")).toBe(false); // minuscule
      expect(isValidTahitiNumber("T1234")).toBe(false); // 4 chiffres
      expect(isValidTahitiNumber("TA2345")).toBe(false); // 2 lettres
      expect(isValidTahitiNumber("123456")).toBe(false); // pas de lettre
      expect(isValidTahitiNumber("")).toBe(false);
    });
  });

  describe("isUnderVatFranchiseThreshold", () => {
    it("est vrai au seuil et en dessous", () => {
      expect(isUnderVatFranchiseThreshold(5_000_000)).toBe(true);
      expect(isUnderVatFranchiseThreshold(1_200_000)).toBe(true);
    });

    it("est faux au-dessus du seuil", () => {
      expect(isUnderVatFranchiseThreshold(5_000_001)).toBe(false);
    });
  });

  describe("computeInvoice — régime ASSUJETTI", () => {
    it("calcule HT/TVA/TTC pour une ligne saisie en HT (taux 16 %)", () => {
      const r = computeInvoice({
        taxRegime: "ASSUJETTI_TVA",
        lines: [
          {
            description: "Prestation",
            quantity: 1,
            unitPrice: 10000,
            priceInputMode: "HT",
            vatRate: 0.16,
          },
        ],
      });
      expect(r.totalHT).toBe(10000);
      expect(r.totalVAT).toBe(1600);
      expect(r.totalTTC).toBe(11600);
      expect(r.legalMention).toBeNull();
      expect(r.vatBuckets).toHaveLength(1);
      expect(r.vatBuckets[0]).toEqual({
        vatRate: 0.16,
        baseHT: 10000,
        vatAmount: 1600,
      });
    });

    it("calcule depuis une saisie TTC (taux 13 %)", () => {
      const r = computeInvoice({
        taxRegime: "ASSUJETTI_TVA",
        lines: [
          {
            description: "Service",
            quantity: 1,
            unitPrice: 11300,
            priceInputMode: "TTC",
            vatRate: 0.13,
          },
        ],
      });
      expect(r.totalHT).toBe(10000);
      expect(r.totalVAT).toBe(1300);
      expect(r.totalTTC).toBe(11300);
    });

    it("gère plusieurs lignes avec des taux différents (décomposition par taux)", () => {
      const r = computeInvoice({
        taxRegime: "ASSUJETTI_TVA",
        lines: [
          {
            description: "Produit importé",
            quantity: 2,
            unitPrice: 5000,
            priceInputMode: "HT",
            vatRate: 0.16,
          },
          {
            description: "Conseil",
            quantity: 1,
            unitPrice: 20000,
            priceInputMode: "HT",
            vatRate: 0.13,
          },
          {
            description: "Denrée alimentaire",
            quantity: 3,
            unitPrice: 1000,
            priceInputMode: "HT",
            vatRate: 0.05,
          },
        ],
      });
      // HT : 10000 (16%) + 20000 (13%) + 3000 (5%) = 33000
      expect(r.totalHT).toBe(33000);
      // TVA : 1600 + 2600 + 150 = 4350
      expect(r.totalVAT).toBe(4350);
      expect(r.totalTTC).toBe(37350);
      expect(r.vatBuckets).toHaveLength(3);
      // triés par taux croissant
      expect(r.vatBuckets.map((b) => b.vatRate)).toEqual([0.05, 0.13, 0.16]);
    });

    it("rejette un taux de TVA non autorisé (ex. 0.20)", () => {
      expect(() =>
        computeInvoice({
          taxRegime: "ASSUJETTI_TVA",
          lines: [
            {
              description: "X",
              quantity: 1,
              unitPrice: 1000,
              priceInputMode: "HT",
              vatRate: 0.2,
            },
          ],
        }),
      ).toThrow();
    });

    it("rejette une quantité nulle ou négative", () => {
      expect(() =>
        computeInvoice({
          taxRegime: "ASSUJETTI_TVA",
          lines: [
            {
              description: "X",
              quantity: 0,
              unitPrice: 1000,
              priceInputMode: "HT",
              vatRate: 0.16,
            },
          ],
        }),
      ).toThrow();
    });

    it("rejette une facture sans ligne", () => {
      expect(() =>
        computeInvoice({ taxRegime: "ASSUJETTI_TVA", lines: [] }),
      ).toThrow();
    });
  });

  describe("computeInvoice — régime FRANCHISE", () => {
    it("force la TVA à 0 et ajoute la mention légale", () => {
      const r = computeInvoice({
        taxRegime: "FRANCHISE",
        lines: [
          {
            description: "Prestation patenté",
            quantity: 2,
            unitPrice: 15000,
            priceInputMode: "HT",
            // même si un taux est fourni, il est ignoré en franchise
            vatRate: 0.16,
          },
        ],
      });
      expect(r.totalHT).toBe(30000);
      expect(r.totalVAT).toBe(0);
      expect(r.totalTTC).toBe(30000);
      expect(r.legalMention).toBe(FRANCHISE_LEGAL_MENTION);
      expect(r.vatBuckets).toEqual([
        { vatRate: 0, baseHT: 30000, vatAmount: 0 },
      ]);
    });

    it("en franchise, une saisie TTC reste inchangée (taux 0)", () => {
      const r = computeInvoice({
        taxRegime: "FRANCHISE",
        lines: [
          {
            description: "Service",
            quantity: 1,
            unitPrice: 8000,
            priceInputMode: "TTC",
            vatRate: 0.13,
          },
        ],
      });
      expect(r.totalHT).toBe(8000);
      expect(r.totalTTC).toBe(8000);
      expect(r.totalVAT).toBe(0);
    });
  });

  describe("Schéma Zod invoiceComputeInputSchema", () => {
    it("valide une entrée correcte", () => {
      const parsed = invoiceComputeInputSchema.safeParse({
        taxRegime: "ASSUJETTI_TVA",
        lines: [
          {
            description: "Test",
            quantity: 1,
            unitPrice: 1000,
            priceInputMode: "HT",
            vatRate: 0.16,
          },
        ],
      });
      expect(parsed.success).toBe(true);
    });

    it("rejette un taux invalide via le schéma", () => {
      const parsed = invoiceComputeInputSchema.safeParse({
        taxRegime: "ASSUJETTI_TVA",
        lines: [
          {
            description: "Test",
            quantity: 1,
            unitPrice: 1000,
            priceInputMode: "HT",
            vatRate: 0.2,
          },
        ],
      });
      expect(parsed.success).toBe(false);
    });

    it("rejette une liste de lignes vide", () => {
      const parsed = invoiceComputeInputSchema.safeParse({
        taxRegime: "FRANCHISE",
        lines: [],
      });
      expect(parsed.success).toBe(false);
    });
  });
});
