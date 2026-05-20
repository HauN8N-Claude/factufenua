import { expect, test } from "@playwright/test";

/**
 * MVP public no-auth flow.
 *
 * Ces tests ne touchent ni la DB ni l'auth : ils valident seulement que la
 * landing publique → éditeur → téléchargement PDF marche bout en bout, et
 * que les pages légales / SEO routes répondent.
 */

test.describe("public invoice flow", () => {
  test("landing → editor → download PDF", async ({ page }) => {
    await page.goto("/");

    // Heading principal de la landing
    await expect(
      page.getByRole("heading", {
        name: /générateur de factures pensé pour les patentés/i,
      }),
    ).toBeVisible();

    // Émetteur
    await page
      .getByLabel("Raison sociale", { exact: true })
      .fill("Société Test E2E");
    await page.getByLabel("Numéro TAHITI (ex. T12345)").fill("T99999");
    await page.getByLabel("Adresse", { exact: true }).first().fill("BP 1 — Papeete");

    // Client (le 2e champ "Nom / raison sociale" est dans la carte Client)
    await page.getByLabel("Nom / raison sociale").fill("Client Test");
    await page
      .getByLabel("Adresse", { exact: true })
      .nth(1)
      .fill("Adresse client");

    // Ligne 1 : description + qty + prix (défaut HT, TVA 13 %)
    await page.getByLabel("Description").first().fill("Prestation de test");
    await page.getByLabel("Quantité").first().fill("2");
    await page.getByLabel("Prix unitaire (XPF)").first().fill("10000");

    // Soumettre → /editeur
    await page
      .getByRole("button", { name: /voir l'aperçu de ma facture/i })
      .click();

    await page.waitForURL(/\/editeur/);
    await expect(page).toHaveURL(/\/editeur/);

    // Le bouton Télécharger doit déclencher un téléchargement de PDF.
    // On utilise page.waitForEvent('download') qui résout dès qu'un download
    // est démarré (sans avoir à attendre la fin).
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.getByRole("button", { name: /télécharger le pdf/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

    const path = await download.path();
    expect(path).toBeTruthy();
  });
});

test.describe("legal pages", () => {
  for (const route of ["/mentions-legales", "/cgu", "/confidentialite"]) {
    test(`${route} responds and renders a heading`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    });
  }
});

test.describe("SEO routes", () => {
  test("/robots.txt disallows admin/auth/orgs and points to sitemap", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/Disallow:\s*\/admin/i);
    expect(body).toMatch(/Disallow:\s*\/auth/i);
    expect(body).toMatch(/Disallow:\s*\/orgs/i);
    expect(body).toMatch(/Sitemap:\s*https?:\/\//i);
  });

  test("/sitemap.xml includes home and editor", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("/editeur");
    expect(body).toContain("/mentions-legales");
  });
});
