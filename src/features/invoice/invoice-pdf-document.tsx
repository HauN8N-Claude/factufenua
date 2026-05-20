import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { InvoiceComputeResult } from "@/lib/tax/pf";
import { PF_ALLOWED_CPS_RATES, PF_VAT_RATES } from "@/lib/tax/pf";

/**
 * Template PDF de facture — modèle officiel Polynésie française.
 * Conforme art. LP. 344-5 du Code des impôts (mentions obligatoires) + structure
 * standard observée sur les factures réglementaires PF (bandeau émetteur,
 * bloc TVA détaillé par taux, bloc CPS, mentions de retard).
 */

export type InvoicePdfData = {
  number: string;
  issueDate: Date;
  /** Date limite de règlement (échéance). Optionnelle. */
  dueDate?: Date | string | null;
  company: {
    name: string;
    tahitiNumber: string;
    address: string;
    /** Téléphone. Optionnel. */
    phone?: string | null;
    /** Logo en data URL (base64). Optionnel. */
    logoDataUrl?: string | null;
  };
  client: {
    name: string;
    tahitiNumber: string | null;
    address: string;
  };
  computed: InvoiceComputeResult;
};

const BRAND = "#0E3A5F"; // bleu foncé pour le bandeau émetteur
const BORDER = "#1f2937";
const LIGHT = "#9ca3af";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#111" },

  // Bandeau émetteur
  banner: {
    backgroundColor: BRAND,
    color: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerLogo: { width: 50, height: 50, objectFit: "contain" },
  bannerText: { flex: 1, textAlign: "center" },
  bannerLabel: { fontSize: 8, marginBottom: 4 },
  bannerLine: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  // En-tête facture (gauche / client à droite)
  headRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  headLeft: { width: "55%" },
  factureTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  field: { flexDirection: "row", marginBottom: 2 },
  fieldLabel: { fontFamily: "Helvetica-Bold", width: 140 },
  fieldValue: {},

  clientBox: {
    width: "45%",
    border: `1pt solid ${BORDER}`,
    padding: 10,
  },
  clientHeader: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: LIGHT,
    marginBottom: 4,
    textAlign: "center",
  },
  clientLine: { textAlign: "center", marginBottom: 2 },

  // Tableau lignes
  table: { marginTop: 16, border: `1pt solid ${BORDER}` },
  th: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottom: `1pt solid ${BORDER}`,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  td: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #d1d5db",
    minHeight: 18,
  },
  cell: { paddingHorizontal: 4, paddingVertical: 4 },
  cDate: { width: "14%", borderRight: `0.5pt solid ${BORDER}` },
  cDesc: { width: "34%", borderRight: `0.5pt solid ${BORDER}` },
  cQty: { width: "10%", textAlign: "right", borderRight: `0.5pt solid ${BORDER}` },
  cPu: { width: "16%", textAlign: "right", borderRight: `0.5pt solid ${BORDER}` },
  cRem: { width: "8%", textAlign: "right", borderRight: `0.5pt solid ${BORDER}` },
  cTot: { width: "18%", textAlign: "right" },

  // Blocs bas (TVA/CPS à gauche, totaux à droite)
  bottomRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  bottomLeft: { width: "55%", flexDirection: "column", gap: 8 },
  bottomRight: { width: "42%" },

  taxBlock: { border: `1pt solid ${BORDER}` },
  taxHead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    borderBottom: `0.5pt solid ${BORDER}`,
  },
  taxRow: { flexDirection: "row", borderBottom: "0.5pt solid #d1d5db" },
  taxTotalRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    fontFamily: "Helvetica-Bold",
  },
  taxCellBase: {
    width: "40%",
    paddingHorizontal: 4,
    paddingVertical: 3,
    textAlign: "right",
    borderRight: `0.5pt solid ${BORDER}`,
  },
  taxCellRate: {
    width: "20%",
    paddingHorizontal: 4,
    paddingVertical: 3,
    textAlign: "center",
    borderRight: `0.5pt solid ${BORDER}`,
  },
  taxCellAmount: {
    width: "40%",
    paddingHorizontal: 4,
    paddingVertical: 3,
    textAlign: "right",
  },

  totalsBox: { border: `1pt solid ${BORDER}` },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottom: `0.5pt solid ${BORDER}`,
  },
  totalRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  totalLabel: {},
  totalAmount: {},

  // Pied de page
  footer: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 24,
    fontSize: 7,
    color: "#374151",
    textAlign: "center",
  },
  franchiseMention: {
    marginTop: 14,
    fontSize: 8,
    color: "#374151",
    fontStyle: "italic",
    textAlign: "center",
  },
});

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const fmtDate = (d: Date | string | null | undefined) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return typeof d === "string" ? d : "";
  return date.toLocaleDateString("fr-FR");
};
const ratePct = (r: number) => `${Math.round(r * 100)}`;

const LEGAL_FOOTER =
  "Pas d'escompte en cas de paiement anticipé. Pénalités de retard 10 % et indemnité forfaitaire pour frais de recouvrement 5 000 F CFP en cas de retard de paiement.";

export const InvoicePdfDocument = ({ data }: { data: InvoicePdfData }) => {
  const { company, client, computed } = data;

  // Affichage TOUJOURS des 4 taux TVA officiels (0/5/13/16), même si absents
  const vatRatesOrdered = [
    PF_VAT_RATES.EXONERE,
    PF_VAT_RATES.REDUIT,
    PF_VAT_RATES.INTERMEDIAIRE,
    PF_VAT_RATES.NORMAL,
  ];
  const vatBucketByRate = new Map(
    computed.vatBuckets.map((b) => [b.vatRate, b]),
  );
  const cpsBucketByRate = new Map(
    computed.cpsBuckets.map((b) => [b.cpsRate, b]),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Bandeau émetteur */}
        <View style={styles.banner}>
          {company.logoDataUrl ? (
            <Image src={company.logoDataUrl} style={styles.bannerLogo} />
          ) : null}
          <View style={styles.bannerText}>
            <Text style={styles.bannerLabel}>
              N° TAHITI, NOM ET ADRESSE DU VENDEUR / PRESTATAIRE
            </Text>
            <Text style={styles.bannerLine}>
              N° {company.tahitiNumber} — {company.name}
            </Text>
            <Text style={styles.bannerLine}>{company.address}</Text>
            {company.phone ? (
              <Text style={styles.bannerLabel}>Tél. {company.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* En-tête facture / client */}
        <View style={styles.headRow}>
          <View style={styles.headLeft}>
            <Text style={styles.factureTitle}>FACTURE</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date Facture :</Text>
              <Text style={styles.fieldValue}>{fmtDate(data.issueDate)}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>N° Facture :</Text>
              <Text style={styles.fieldValue}>{data.number}</Text>
            </View>
            {data.dueDate ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Date limite de règlement :
                </Text>
                <Text style={styles.fieldValue}>{fmtDate(data.dueDate)}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.clientBox}>
            <Text style={styles.clientHeader}>
              N° TAHITI, NOM ET ADRESSE DU CLIENT
            </Text>
            {client.tahitiNumber ? (
              <Text style={styles.clientLine}>N° {client.tahitiNumber}</Text>
            ) : null}
            <Text style={styles.clientLine}>{client.name}</Text>
            <Text style={styles.clientLine}>{client.address}</Text>
          </View>
        </View>

        {/* Tableau lignes */}
        <View style={styles.table}>
          <View style={styles.th}>
            <Text style={[styles.cell, styles.cDate]}>DATE DE L'OPÉRATION</Text>
            <Text style={[styles.cell, styles.cDesc]}>DÉSIGNATION</Text>
            <Text style={[styles.cell, styles.cQty]}>QTÉS UNIT TARIFS</Text>
            <Text style={[styles.cell, styles.cPu]}>PRIX UNIT H.T</Text>
            <Text style={[styles.cell, styles.cRem]}>% REM</Text>
            <Text style={[styles.cell, styles.cTot]}>TOTAL</Text>
          </View>
          {computed.lines.map((l, i) => (
            <View style={styles.td} key={i}>
              <Text style={[styles.cell, styles.cDate]}>
                {fmtDate(l.dateOperation)}
              </Text>
              <Text style={[styles.cell, styles.cDesc]}>{l.description}</Text>
              <Text style={[styles.cell, styles.cQty]}>{l.quantity}</Text>
              <Text style={[styles.cell, styles.cPu]}>{fmt(l.unitPriceHT)}</Text>
              <Text style={[styles.cell, styles.cRem]}>
                {(l.discountPercent ?? 0) > 0
                  ? `${l.discountPercent}`
                  : ""}
              </Text>
              <Text style={[styles.cell, styles.cTot]}>{fmt(l.lineTotalHT)}</Text>
            </View>
          ))}
        </View>

        {/* Blocs bas : TVA + CPS à gauche, totaux à droite */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            {/* Bloc TVA */}
            <View style={styles.taxBlock}>
              <View style={styles.taxHead}>
                <Text style={styles.taxCellBase}>BASE H.T</Text>
                <Text style={styles.taxCellRate}>TAUX</Text>
                <Text style={styles.taxCellAmount}>MONTANT TAXE</Text>
              </View>
              {vatRatesOrdered.map((rate) => {
                const b = vatBucketByRate.get(rate);
                return (
                  <View style={styles.taxRow} key={`vat-${rate}`}>
                    <Text style={styles.taxCellBase}>
                      {b ? fmt(b.baseHT) : ""}
                    </Text>
                    <Text style={styles.taxCellRate}>{ratePct(rate)}</Text>
                    <Text style={styles.taxCellAmount}>
                      {b ? fmt(b.vatAmount) : ""}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.taxTotalRow}>
                <Text style={[styles.taxCellBase, { textAlign: "left" }]}>
                  MONTANT TOTAL TVA
                </Text>
                <Text style={styles.taxCellRate}></Text>
                <Text style={styles.taxCellAmount}>{fmt(computed.totalVAT)}</Text>
              </View>
            </View>

            {/* Bloc CPS */}
            <View style={styles.taxBlock}>
              <View style={styles.taxHead}>
                <Text style={styles.taxCellBase}>BASE H.T</Text>
                <Text style={styles.taxCellRate}>CPS</Text>
                <Text style={styles.taxCellAmount}>MONTANT</Text>
              </View>
              {PF_ALLOWED_CPS_RATES.map((rate) => {
                const b = cpsBucketByRate.get(rate);
                return (
                  <View style={styles.taxRow} key={`cps-${rate}`}>
                    <Text style={styles.taxCellBase}>
                      {b ? fmt(b.baseHT) : ""}
                    </Text>
                    <Text style={styles.taxCellRate}>{ratePct(rate)}</Text>
                    <Text style={styles.taxCellAmount}>
                      {b ? fmt(b.cpsAmount) : ""}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.taxTotalRow}>
                <Text style={[styles.taxCellBase, { textAlign: "left" }]}>
                  MONTANT TOTAL CPS
                </Text>
                <Text style={styles.taxCellRate}></Text>
                <Text style={styles.taxCellAmount}>{fmt(computed.totalCPS)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomRight}>
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL FACTURE HORS TAXES</Text>
                <Text style={styles.totalAmount}>{fmt(computed.totalHT)} XPF</Text>
              </View>
              <View style={styles.totalRowLast}>
                <Text style={styles.totalLabel}>TOTAL FACTURE T.T.C</Text>
                <Text style={styles.totalAmount}>{fmt(computed.totalTTC)} XPF</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Mention franchise (si applicable) */}
        {computed.legalMention ? (
          <Text style={styles.franchiseMention}>{computed.legalMention}</Text>
        ) : null}

        {/* Pied de page : mentions légales escompte / pénalités */}
        <Text style={styles.footer} fixed>
          {LEGAL_FOOTER}
        </Text>
      </Page>
    </Document>
  );
};
