import { LandingHeader } from "@/features/landing/landing-header";
import { Footer } from "@/features/layout/footer";
import { InvoiceEditor } from "@/features/public-invoice/invoice-editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aperçu et modification de la facture — FactuFenua",
  description:
    "Modifiez votre facture directement sur l'aperçu, puis téléchargez le PDF conforme à la fiscalité de la Polynésie française.",
};

export default function EditeurPage() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <div className="mt-16" />
      <LandingHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
        <InvoiceEditor />
      </main>
      <Footer />
    </div>
  );
}
