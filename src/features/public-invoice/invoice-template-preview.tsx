"use client";

import { upfetch } from "@/lib/up-fetch";
import { useEffect, useState } from "react";

/**
 * Aperçu du TEMPLATE de facture uniquement (sans formulaire de remplissage).
 * Génère le PDF avec des données d'exemple pour visualiser la mise en page.
 */

const SAMPLE = {
  emitter: {
    name: "Teva Services (exemple)",
    tahitiNumber: "T12345",
    address: "BP 1234 - 98713 Papeete, Tahiti",
    taxRegime: "ASSUJETTI_TVA" as const,
  },
  client: {
    name: "Pension Tiare (exemple)",
    tahitiNumber: "C67890",
    address: "Baie de Cook - 98729 Moorea",
  },
  number: "2026-0001",
  issueDate: "2026-05-19",
  dueDate: "2026-06-18",
  lines: [
    {
      description: "Prestation de service (conseil)",
      dateOperation: "2026-05-10",
      quantity: "10",
      unitPrice: "8000",
      priceInputMode: "HT" as const,
      vatRate: "0.13",
      discountPercent: "5",
      cpsRate: "0.01",
    },
    {
      description: "Fourniture de matériel",
      dateOperation: "2026-05-15",
      quantity: "2",
      unitPrice: "29000",
      priceInputMode: "TTC" as const,
      vatRate: "0.16",
    },
  ],
};

export const InvoiceTemplatePreview = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoked = false;
    let currentUrl: string | null = null;

    void (async () => {
      try {
        const blob = await upfetch("/api/public/invoice-pdf", {
          method: "POST",
          body: SAMPLE,
          parseResponse: async (res) => res.blob(),
        });
        // Closure capture : `revoked` est passé à true par la cleanup
        // function ci-dessous si le composant est démonté avant la réponse.
        // ESLint ne suit pas la mutation cross-closure → faux positif.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (revoked) return;
        currentUrl = URL.createObjectURL(blob as Blob);
        setPdfUrl(currentUrl);
      } catch {
        setError(true);
      }
    })();

    return () => {
      revoked = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, []);

  if (error) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        Impossible de générer l'aperçu du template.
      </p>
    );
  }

  if (!pdfUrl) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        Génération de l'aperçu…
      </p>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      title="Template de facture"
      className="h-[85vh] w-full rounded-md border"
    />
  );
};
