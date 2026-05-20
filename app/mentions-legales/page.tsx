import { Typography } from "@/components/nowts/typography";
import { LandingHeader } from "@/features/landing/landing-header";
import { Footer } from "@/features/layout/footer";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Mentions légales — ${SiteConfig.title}`,
  description: `Mentions légales du site ${SiteConfig.title}, générateur de factures conforme à la fiscalité de la Polynésie française.`,
  robots: { index: true, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <div className="mt-16" />
      <LandingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 lg:px-8">
        <Typography variant="h1" className="mb-2 text-3xl sm:text-4xl">
          Mentions légales
        </Typography>
        <Typography variant="muted" className="mb-8">
          Dernière mise à jour : 20 mai 2026
        </Typography>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            Éditeur du site
          </Typography>
          <Typography variant="p">
            Le site <strong>{SiteConfig.title}</strong>, accessible à l'adresse{" "}
            <a href={SiteConfig.prodUrl} className="underline">
              {SiteConfig.prodUrl}
            </a>
            , est édité par :
          </Typography>
          <ul className="ml-6 list-disc">
            <li>
              Raison sociale : <strong>PolynetIA</strong>
            </li>
            <li>Forme juridique : Entreprise Individuelle (EI)</li>
            <li>
              Numéro TAHITI : <strong>F95709</strong>
            </li>
            <li>Adresse du siège : Punaauia 98718, Tahiti, Polynésie française</li>
            <li>
              Email de contact :{" "}
              <a
                href="mailto:contact@polynetia.com"
                className="underline"
              >
                contact@polynetia.com
              </a>
            </li>
            <li>Directeur de la publication : PolynetIA</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            Hébergeur
          </Typography>
          <Typography variant="p">
            Le site est hébergé par :
          </Typography>
          <ul className="ml-6 list-disc">
            <li>Vercel Inc.</li>
            <li>340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
            <li>
              Site web :{" "}
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline"
              >
                vercel.com
              </a>
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            Propriété intellectuelle
          </Typography>
          <Typography variant="p">
            L'ensemble du contenu de ce site (textes, graphismes, logo, code
            source) est la propriété exclusive de l'éditeur, sauf mention
            contraire. Toute reproduction, représentation, modification ou
            adaptation totale ou partielle est interdite sans autorisation
            écrite préalable.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            Responsabilité
          </Typography>
          <Typography variant="p">
            {SiteConfig.title} est un outil d'aide à la rédaction de factures.
            L'éditeur met en œuvre ses meilleurs efforts pour assurer la
            conformité du moteur fiscal avec la réglementation en vigueur en
            Polynésie française, sans toutefois pouvoir garantir l'absence
            d'erreur. L'utilisateur reste seul responsable de la vérification
            des factures émises et de leur conformité à sa situation fiscale et
            commerciale.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            Droit applicable
          </Typography>
          <Typography variant="p">
            Les présentes mentions légales sont soumises au droit français.
            Tout litige relatif à l'utilisation du site relèvera de la
            compétence exclusive des tribunaux de Papeete (Polynésie
            française).
          </Typography>
        </section>
      </main>
      <Footer />
    </div>
  );
}
