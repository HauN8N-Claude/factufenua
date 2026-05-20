import { CircleSvg } from "@/components/svg/circle-svg";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Typography } from "../../components/nowts/typography";

export const Hero = () => {
  return (
    <div className="relative isolate flex flex-col">
      <GridBackground />
      <main className="relative py-24 sm:py-32 lg:pb-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Typography
              variant="h1"
              className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl lg:text-7xl"
            >
              Le générateur de factures pensé pour les{" "}
              <span className="relative inline-block">
                <span>patentés</span>
                <CircleSvg className="fill-primary absolute inset-0" />
              </span>{" "}
              de Polynésie française
            </Typography>
            <Typography
              variant="large"
              className="text-muted-foreground mt-8 text-lg font-medium text-pretty sm:text-xl/8"
            >
              Le générateur de factures gratuit, 100 % conforme à la fiscalité
              polynésienne : TVA locale, numéro TAHITI, franchise en base,
              Franc Pacifique. Pensé pour les patentés et micro-entrepreneurs.
            </Typography>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/facture/nouvelle"
                className={buttonVariants({ size: "lg", variant: "default" })}
              >
                Créer ma facture
              </Link>
              <Link
                href="#features"
                className={buttonVariants({ size: "lg", variant: "link" })}
              >
                En savoir plus <span aria-hidden="true">→</span>
              </Link>
            </div>
            <Typography
              variant="muted"
              className="mt-6 text-sm"
            >
              Gratuit et illimité — sans carte bancaire.
            </Typography>
          </div>
        </div>
      </main>
    </div>
  );
};

const GridBackground = () => {
  return (
    <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(180deg,transparent,var(--foreground),transparent)]"></div>
  );
};
