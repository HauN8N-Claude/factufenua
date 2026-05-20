export const SiteConfig = {
  title: "FactuFenua",
  description:
    "Générateur de factures gratuit, 100 % conforme à la fiscalité de la Polynésie française. Pensé pour les patentés et micro-entrepreneurs.",
  prodUrl: "https://factufenua.com",
  appId: "factufenua",
  domain: "factufenua.com",
  appIcon: "/images/icon.png",
  company: {
    name: "PolynetIA",
    address: "Punaauia 98718, Tahiti, Polynésie française",
  },
  brand: {
    primary: "#0077B6", // bleu lagon
  },
  team: {
    image: "https://melvynx.com/images/me/twitter-en.jpg",
    website: "https://factufenua.com",
    twitter: "https://factufenua.com",
    name: "FactuFenua",
  },
  features: {
    /**
     * If enable, you need to specify the logic of upload here : src/features/images/uploadImageAction.tsx
     * You can use Vercel Blob Storage : https://vercel.com/docs/storage/vercel-blob
     * Or you can use Cloudflare R2 : https://mlv.sh/cloudflare-r2-tutorial
     * Or you can use AWS S3 : https://mlv.sh/aws-s3-tutorial
     */
    enableImageUpload: false as boolean,
    /**
     * If enable, the user will be redirected to `/orgs` when he visits the landing page at `/`
     * The logic is located in middleware.ts
     *
     * MVP no-auth : forced to `false`. La home `/` est l'outil public, jamais
     * de redirect vers /orgs même si un cookie de session traîne.
     */
    enableLandingRedirection: false as boolean,
  },
};
