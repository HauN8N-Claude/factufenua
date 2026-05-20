import { Typography } from "@/components/nowts/typography";
import { LandingHeader } from "@/features/landing/landing-header";
import { Footer } from "@/features/layout/footer";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Conditions Générales d'Utilisation — ${SiteConfig.title}`,
  description: `Conditions Générales d'Utilisation du service ${SiteConfig.title}.`,
  robots: { index: true, follow: true },
};

export default function CGUPage() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <div className="mt-16" />
      <LandingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 lg:px-8">
        <Typography variant="h1" className="mb-2 text-3xl sm:text-4xl">
          Conditions Générales d'Utilisation
        </Typography>
        <Typography variant="muted" className="mb-8">
          Dernière mise à jour : 20 mai 2026
        </Typography>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            1. Objet
          </Typography>
          <Typography variant="p">
            Les présentes Conditions Générales d'Utilisation (« CGU »)
            régissent l'utilisation du service{" "}
            <strong>{SiteConfig.title}</strong> (le « Service »), accessible à
            l'adresse{" "}
            <a href={SiteConfig.prodUrl} className="underline">
              {SiteConfig.prodUrl}
            </a>
            , édité par <strong>PolynetIA</strong> (Entreprise Individuelle,
            N° TAHITI F95709, Punaauia 98718, Tahiti, Polynésie française —
            l'« Éditeur »). Le Service est un générateur de factures en
            ligne, gratuit et sans inscription, destiné aux professionnels
            exerçant en Polynésie française. Les informations complètes
            relatives à l'Éditeur sont disponibles sur la page{" "}
            <Link href="/mentions-legales" className="underline">
              Mentions légales
            </Link>
            .
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            2. Acceptation des CGU
          </Typography>
          <Typography variant="p">
            L'utilisation du Service implique l'acceptation pleine et entière
            des présentes CGU. L'utilisateur qui n'accepte pas tout ou partie
            des CGU doit renoncer à utiliser le Service.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            3. Description du Service
          </Typography>
          <Typography variant="p">
            Le Service permet à l'utilisateur de saisir les informations
            nécessaires à la rédaction d'une facture (émetteur, client, lignes
            de prestation, taux de TVA, etc.) puis de générer un fichier PDF
            téléchargeable. Les données saisies sont stockées localement dans
            le navigateur de l'utilisateur (<code>localStorage</code>) et ne
            sont pas transmises à l'éditeur, à l'exception du contenu
            strictement nécessaire à la génération technique du PDF, qui n'est
            pas conservé sur le serveur.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            4. Gratuité
          </Typography>
          <Typography variant="p">
            Le Service est fourni gratuitement. L'éditeur se réserve la
            possibilité de proposer ultérieurement des fonctionnalités
            payantes, qui feront l'objet de conditions spécifiques.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            5. Obligations de l'utilisateur
          </Typography>
          <Typography variant="p">L'utilisateur s'engage à :</Typography>
          <ul className="ml-6 list-disc">
            <li>
              Utiliser le Service conformément à la législation en vigueur et
              aux présentes CGU.
            </li>
            <li>
              Vérifier l'exactitude des informations saisies et la conformité
              des factures émises à sa propre situation fiscale.
            </li>
            <li>
              Ne pas tenter de détourner le Service de sa finalité, ni de
              porter atteinte à son intégrité technique.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            6. Limitation de responsabilité
          </Typography>
          <Typography variant="p">
            Le Service est fourni « en l'état » et « selon disponibilité ».
            L'éditeur met en œuvre ses meilleurs efforts pour maintenir le
            moteur fiscal conforme à la réglementation applicable en Polynésie
            française (taux de TVA 5 / 13 / 16 %, franchise en base, mentions
            obligatoires, etc.), mais ne peut garantir l'absence d'erreur,
            d'omission ou de modification réglementaire postérieure à la
            dernière mise à jour du Service.
          </Typography>
          <Typography variant="p">
            <strong>
              L'utilisateur est seul responsable de la conformité des factures
              qu'il émet et de leur acceptation par l'administration fiscale.
            </strong>{" "}
            Il est vivement recommandé de faire valider l'usage du Service par
            un expert-comptable.
          </Typography>
          <Typography variant="p">
            L'éditeur ne pourra en aucun cas être tenu responsable des
            dommages directs ou indirects résultant de l'utilisation ou de
            l'impossibilité d'utiliser le Service, ni des conséquences fiscales
            ou commerciales liées aux factures générées.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            7. Propriété intellectuelle
          </Typography>
          <Typography variant="p">
            Les contenus, marques, logos et code source du Service sont la
            propriété exclusive de l'éditeur. Les factures générées par
            l'utilisateur lui appartiennent.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            8. Données personnelles
          </Typography>
          <Typography variant="p">
            Le traitement des données personnelles est détaillé dans la{" "}
            <Link href="/confidentialite" className="underline">
              Politique de confidentialité
            </Link>
            .
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            9. Évolution des CGU
          </Typography>
          <Typography variant="p">
            L'éditeur se réserve le droit de modifier les présentes CGU à tout
            moment. La version applicable est celle en vigueur au moment de
            l'utilisation du Service.
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            10. Droit applicable et juridiction
          </Typography>
          <Typography variant="p">
            Les présentes CGU sont soumises au droit français. Tout litige
            relatif à leur interprétation ou à leur exécution relève de la
            compétence exclusive des tribunaux de Papeete (Polynésie
            française).
          </Typography>
        </section>

        <section className="flex flex-col gap-3">
          <Typography variant="h2" className="mt-8 text-2xl">
            11. Contact
          </Typography>
          <Typography variant="p">
            Pour toute question ou réclamation relative au Service ou aux
            présentes CGU, vous pouvez contacter l'Éditeur à l'adresse :{" "}
            <a href="mailto:contact@polynetia.com" className="underline">
              contact@polynetia.com
            </a>
            .
          </Typography>
        </section>
      </main>
      <Footer />
    </div>
  );
}
