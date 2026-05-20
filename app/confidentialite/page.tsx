import { Typography } from "@/components/nowts/typography";
import { LandingHeader } from "@/features/landing/landing-header";
import { Footer } from "@/features/layout/footer";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Politique de confidentialité — ${SiteConfig.title}`,
  description: `Politique de confidentialité de ${SiteConfig.title} : aucune donnée personnelle stockée sur nos serveurs.`,
  robots: { index: true, follow: true },
};

export default function ConfidentialitePage() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <div className="mt-16" />
      <LandingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 lg:px-8">
        <Typography variant="h1" className="mb-2 text-3xl sm:text-4xl">
          Politique de confidentialité
        </Typography>
        <Typography variant="muted" className="mb-8">
          Dernière mise à jour : 20 mai 2026
        </Typography>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            En résumé
          </Typography>
          <Typography variant="p">
            <strong>{SiteConfig.title}</strong> est conçu pour respecter la vie
            privée de ses utilisateurs. Les données saisies dans le générateur
            de factures (informations émetteur, client, lignes de prestation)
            <strong> restent dans votre navigateur</strong> et ne sont jamais
            envoyées à nos serveurs pour y être stockées.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            1. Responsable du traitement
          </Typography>
          <Typography variant="p">
            Le responsable du traitement des données personnelles est :
          </Typography>
          <ul className="ml-6 list-disc">
            <li>
              <strong>PolynetIA</strong> — Entreprise Individuelle, N° TAHITI
              F95709
            </li>
            <li>Punaauia 98718, Tahiti, Polynésie française</li>
            <li>
              Email :{" "}
              <a
                href="mailto:contact@polynetia.com"
                className="underline"
              >
                contact@polynetia.com
              </a>
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            2. Données collectées
          </Typography>
          <Typography variant="h3" className="mt-4 text-lg">
            2.1 Données saisies dans le générateur de factures
          </Typography>
          <Typography variant="p">
            Les informations que vous saisissez dans le formulaire (nom de
            votre entreprise, n° TAHITI, adresse, clients, lignes de
            prestation, logo, etc.) sont stockées exclusivement dans la
            mémoire locale (<code>localStorage</code>) de votre navigateur,
            sur votre appareil. Elles ne sont pas transmises à nos serveurs
            pour y être conservées.
          </Typography>
          <Typography variant="p">
            Lors de la génération du PDF, le contenu de votre facture transite
            temporairement par nos serveurs (hébergés par Vercel) le temps
            strictement nécessaire à la production du document. Aucune copie
            n'est conservée après la génération.
          </Typography>

          <Typography variant="h3" className="mt-6 text-lg">
            2.2 Données de mesure d'audience
          </Typography>
          <Typography variant="p">
            Nous utilisons <strong>Vercel Analytics</strong> pour mesurer la
            fréquentation du site (nombre de visiteurs, pages consultées,
            sources de trafic). Cet outil est anonyme par conception : aucune
            adresse IP n'est stockée, aucun cookie de suivi n'est déposé,
            aucune empreinte d'appareil (« fingerprinting ») n'est utilisée.
            Pour cette raison, aucune bannière de consentement aux cookies
            n'est nécessaire.
          </Typography>
          <Typography variant="p">
            Plus d'informations :{" "}
            <a
              href="https://vercel.com/docs/analytics/privacy-policy"
              target="_blank"
              rel="noreferrer noopener"
              className="underline"
            >
              Politique de confidentialité de Vercel Analytics
            </a>
            .
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            3. Cookies
          </Typography>
          <Typography variant="p">
            Le Service n'utilise <strong>aucun cookie de suivi publicitaire
            ni de tracking</strong>. Seul le mécanisme natif{" "}
            <code>localStorage</code> du navigateur est utilisé pour mémoriser
            vos propres informations émetteur d'une visite à l'autre, et
            uniquement sur votre appareil.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            4. Vos droits (RGPD)
          </Typography>
          <Typography variant="p">
            Conformément au Règlement Général sur la Protection des Données
            (RGPD) et à la loi « Informatique et Libertés », vous disposez
            d'un droit d'accès, de rectification, d'effacement, de limitation,
            de portabilité et d'opposition au traitement de vos données.
          </Typography>
          <Typography variant="p">
            Comme aucune donnée personnelle n'est stockée sur nos serveurs,
            vous pouvez exercer la plupart de ces droits directement depuis
            votre navigateur : vider le <code>localStorage</code> du site
            efface l'intégralité des données saisies.
          </Typography>
          <Typography variant="p">
            Pour toute question relative à vos données, contactez-nous à :{" "}
            <a href="mailto:contact@polynetia.com" className="underline">
              contact@polynetia.com
            </a>
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            5. Durée de conservation
          </Typography>
          <Typography variant="p">
            Les données saisies sont conservées dans le{" "}
            <code>localStorage</code> de votre navigateur jusqu'à ce que vous
            les supprimiez vous-même. Les données de mesure d'audience sont
            agrégées et anonymes ; elles sont conservées par Vercel selon sa
            propre politique.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            6. Transferts hors UE
          </Typography>
          <Typography variant="p">
            Le site est hébergé par Vercel Inc. (États-Unis). Vercel adhère
            aux Clauses Contractuelles Types (CCT) de la Commission européenne
            pour garantir un niveau de protection adéquat des données
            transférées hors de l'Union européenne.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            7. Modification de la politique
          </Typography>
          <Typography variant="p">
            La présente politique peut être mise à jour à tout moment. La
            version applicable est celle accessible sur le site au moment de
            la consultation.
          </Typography>
        </section>
      </main>
      <Footer />
    </div>
  );
}
