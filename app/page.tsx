import { Typography } from "@/components/nowts/typography";
import { LandingHeader } from "@/features/landing/landing-header";
import { Footer } from "@/features/layout/footer";
import { InvoiceForm } from "@/features/public-invoice/invoice-form";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";

const TITLE = `${SiteConfig.title} — Générateur de factures gratuit pour la Polynésie française`;
const DESCRIPTION =
  "Créez en quelques secondes des factures 100 % conformes à la fiscalité de la Polynésie française (TVA 5/13/16 %, n° TAHITI, franchise en base, XPF). Gratuit, sans inscription, aucune donnée envoyée à nos serveurs.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "générateur facture polynésie française",
    "facture patenté tahiti",
    "facture TVA polynésie",
    "n° TAHITI facture",
    "facture micro-entrepreneur PF",
    "facture XPF",
    "modèle facture polynésie",
    "FactuFenua",
  ],
  alternates: {
    canonical: SiteConfig.prodUrl,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SiteConfig.prodUrl,
    siteName: SiteConfig.title,
    locale: "fr_PF",
    type: "website",
    images: [
      {
        url: "/images/hero.png",
        width: 684,
        height: 560,
        alt: `Aperçu du générateur de factures ${SiteConfig.title}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/hero.png"],
  },
};

export default function HomePage() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <div className="mt-16" />
      <LandingHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <Typography
            variant="h1"
            className="text-3xl font-semibold text-balance sm:text-4xl"
          >
            Le générateur de factures pensé pour les patentés de Polynésie française
          </Typography>
          <Typography variant="large" className="text-muted-foreground">
            Rapide, Gratuit et sans Inscription.
          </Typography>
        </div>
        <InvoiceForm />
      </main>
      <Footer />
    </div>
  );
}
