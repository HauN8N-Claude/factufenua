"use client";

import { Button } from "@/components/ui/button";
import { upfetch } from "@/lib/up-fetch";
import {
  computeInvoice,
  PF_ALLOWED_CPS_RATES,
  PF_VAT_RATES,
  type TaxRegime,
} from "@/lib/tax/pf";
import { ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PublicInvoiceSchema } from "./public-invoice.schema";

/**
 * Éditeur WYSIWYG de facture : l'utilisateur édite directement sur l'aperçu
 * grand format. Émetteur (et logo) mémorisés en localStorage. Le PDF est
 * généré seulement au téléchargement (aucune donnée envoyée à un serveur
 * avant cette action).
 */

const EMITTER_KEY = "factufenua:emitter";
const CURRENT_INVOICE_KEY = "factufenua:current-invoice";
const LOGO_MAX_BYTES = 500_000; // 500 KB max pour ne pas saturer localStorage

type Emitter = {
  name: string;
  tahitiNumber: string;
  address: string;
  phone: string;
  taxRegime: TaxRegime;
  logoDataUrl: string;
};

type Client = { name: string; tahitiNumber: string; address: string };

type Line = {
  description: string;
  quantity: string;
  unitPrice: string;
  priceInputMode: "HT" | "TTC";
  vatRate: string;
  discountPercent: string;
  cpsRate: string;
};

const emptyLine: Line = {
  description: "",
  quantity: "1",
  unitPrice: "0",
  priceInputMode: "HT",
  vatRate: "0.13",
  discountPercent: "0",
  cpsRate: "0",
};

const fmtXpf = (n: number) =>
  `${new Intl.NumberFormat("fr-FR").format(n)} XPF`;
const fmtNum = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const todayIso = () => new Date().toISOString().slice(0, 10);
const addDaysIso = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Champ texte "inline" : transparent, surligné au hover/focus.
// - inlineLight : pour le bandeau sombre (texte blanc, hover blanc translucide)
// - inlineDark  : pour le corps blanc du document (texte sombre, hover gris clair)
const inlineLight =
  "bg-transparent rounded px-1 -mx-1 hover:bg-white/10 focus:bg-white/20 focus:outline-none transition-colors w-full";
const inlineDark =
  "bg-transparent rounded px-1 -mx-1 hover:bg-neutral-200/70 focus:bg-neutral-300/70 focus:outline-none transition-colors w-full text-neutral-900";

const LEGAL_FOOTER =
  "Pas d'escompte en cas de paiement anticipé. Pénalités de retard 10 % et indemnité forfaitaire pour frais de recouvrement 5 000 F CFP en cas de retard de paiement.";

export const InvoiceEditor = () => {
  const router = useRouter();

  const [emitter, setEmitter] = useState<Emitter>({
    name: "",
    tahitiNumber: "",
    address: "",
    phone: "",
    taxRegime: "FRANCHISE",
    logoDataUrl: "",
  });
  const [client, setClient] = useState<Client>({
    name: "",
    tahitiNumber: "",
    address: "",
  });

  const [number, setNumber] = useState(
    `${new Date().getFullYear()}-0001`,
  );
  const initialIssue = todayIso();
  const [issueDate, setIssueDate] = useState(initialIssue);
  const [dueDate, setDueDate] = useState(addDaysIso(initialIssue, 30));
  const [dueDateOverridden, setDueDateOverridden] = useState(false);

  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Au mount, on attend la facture "en cours" écrite par le formulaire.
  // Si absente → on redirige vers le formulaire. Sinon → on charge.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(CURRENT_INVOICE_KEY);
    } catch {
      /* ignore */
    }
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      const data = JSON.parse(raw);
      if (data.emitter) setEmitter(data.emitter);
      if (data.client) setClient(data.client);
      if (typeof data.number === "string") setNumber(data.number);
      if (typeof data.issueDate === "string") setIssueDate(data.issueDate);
      if (typeof data.dueDate === "string") setDueDate(data.dueDate);
      if (typeof data.dueDateOverridden === "boolean")
        setDueDateOverridden(data.dueDateOverridden);
      if (Array.isArray(data.lines) && data.lines.length > 0)
        setLines(data.lines);
    } catch {
      /* fallback : on garde les valeurs par défaut */
    }
    setHydrated(true);
  }, [router]);

  // Sauver l'émetteur (incluant logo) à chaque modif
  useEffect(() => {
    try {
      localStorage.setItem(EMITTER_KEY, JSON.stringify(emitter));
    } catch {
      /* ignore (quota) */
    }
  }, [emitter]);

  // Persister la facture en cours pour que F5 ne perde pas les modifs.
  // Ne s'exécute qu'après hydratation pour ne pas écraser l'état chargé.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        CURRENT_INVOICE_KEY,
        JSON.stringify({
          emitter,
          client,
          number,
          issueDate,
          dueDate,
          dueDateOverridden,
          lines,
        }),
      );
    } catch {
      /* ignore (quota) */
    }
  }, [
    hydrated,
    emitter,
    client,
    number,
    issueDate,
    dueDate,
    dueDateOverridden,
    lines,
  ]);

  // Échéance = facture + 30 jours tant que l'utilisateur n'a pas touché
  useEffect(() => {
    if (!dueDateOverridden && issueDate) {
      setDueDate(addDaysIso(issueDate, 30));
    }
  }, [issueDate, dueDateOverridden]);

  const isFranchise = emitter.taxRegime === "FRANCHISE";

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  // Calculs live (mêmes valeurs que le PDF)
  const preview = (() => {
    try {
      return computeInvoice({
        taxRegime: emitter.taxRegime,
        lines: lines.map((l) => ({
          description: l.description || "—",
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          priceInputMode: l.priceInputMode,
          vatRate: Number(l.vatRate) || 0,
          discountPercent: Number(l.discountPercent) || 0,
          cpsRate: Number(l.cpsRate) || 0,
        })),
      });
    } catch {
      return null;
    }
  })();

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Fichier image attendu (PNG, JPG, SVG…).");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error("Logo trop volumineux (max 500 Ko).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setEmitter((e) => ({ ...e, logoDataUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    const payload = {
      emitter,
      client,
      number,
      issueDate,
      dueDate,
      lines: lines.map((l) => ({
        description: l.description,
        dateOperation: issueDate, // auto : non demandé à l'utilisateur
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        priceInputMode: l.priceInputMode,
        vatRate: l.vatRate,
        discountPercent: l.discountPercent || "0",
        cpsRate: l.cpsRate || "0",
      })),
    };

    const parsed = PublicInvoiceSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire incomplet.");
      return;
    }

    setLoading(true);
    try {
      const blob = await upfetch("/api/public/invoice-pdf", {
        method: "POST",
        body: parsed.data,
        parseResponse: async (res) => res.blob(),
      });
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Facture téléchargée.");
    } catch {
      toast.error("Échec de la génération du PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewInvoice = () => {
    try {
      localStorage.removeItem(CURRENT_INVOICE_KEY);
    } catch {
      /* ignore */
    }
    router.push("/");
  };

  // Évite le flash de facture vide pendant le chargement initial
  if (!hydrated) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Chargement de votre facture…
      </p>
    );
  }

  const vatRatesOrdered = [
    PF_VAT_RATES.EXONERE,
    PF_VAT_RATES.REDUIT,
    PF_VAT_RATES.INTERMEDIAIRE,
    PF_VAT_RATES.NORMAL,
  ];
  const vatBucketByRate = new Map(
    (preview?.vatBuckets ?? []).map((b) => [b.vatRate, b]),
  );
  const cpsBucketByRate = new Map(
    (preview?.cpsBuckets ?? []).map((b) => [b.cpsRate, b]),
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Barre d'outils du haut */}
      <div className="flex w-full max-w-[900px] flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="text-muted-foreground text-xs sm:text-sm">
          Cliquez sur n'importe quel champ pour le modifier.
        </span>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground text-xs sm:text-sm">
            Régime fiscal :
          </label>
          <select
            value={emitter.taxRegime}
            onChange={(e) =>
              setEmitter({
                ...emitter,
                taxRegime: e.target.value as TaxRegime,
              })
            }
            className="bg-background rounded border px-2 py-1 text-sm"
          >
            <option value="FRANCHISE">Franchise en base</option>
            <option value="ASSUJETTI_TVA">Assujetti TVA</option>
          </select>
        </div>
      </div>

      {/* Document A4-like — blanc pour bien ressortir du fond sombre */}
      <div className="w-full max-w-[900px] overflow-hidden rounded-md border border-neutral-300 bg-white text-neutral-900 shadow-2xl">
        {/* Bandeau émetteur (modifiable) */}
        <div
          className="flex flex-col items-center gap-3 px-4 py-4 text-white sm:flex-row sm:gap-4 sm:px-6 sm:py-5"
          style={{ backgroundColor: "#0E3A5F" }}
        >
          {/* Logo */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-white/20 bg-white/5 sm:h-16 sm:w-16">
            {emitter.logoDataUrl ? (
              <div className="group relative h-full w-full">
                <img
                  src={emitter.logoDataUrl}
                  alt="Logo"
                  className="h-full w-full rounded object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEmitter({ ...emitter, logoDataUrl: "" })
                  }
                  className="absolute -top-1 -right-1 hidden rounded-full bg-white/90 p-0.5 text-black group-hover:block"
                  aria-label="Retirer le logo"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center text-[10px] text-white/70 hover:text-white"
              >
                <ImageIcon className="mb-0.5 size-5" />
                Logo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {/* Texte bandeau */}
          <div className="flex flex-1 flex-col items-center text-center">
            <span className="text-[10px] tracking-wide uppercase opacity-70">
              N° TAHITI, NOM ET ADRESSE DU VENDEUR / PRESTATAIRE
            </span>
            <div className="mt-1 flex items-center gap-2 text-[15px] font-semibold">
              <span className="opacity-90">N°</span>
              <input
                value={emitter.tahitiNumber}
                onChange={(e) =>
                  setEmitter({ ...emitter, tahitiNumber: e.target.value })
                }
                placeholder="T12345"
                className={`${inlineLight} max-w-[90px] text-center`}
              />
              <span className="opacity-80">—</span>
              <input
                value={emitter.name}
                onChange={(e) =>
                  setEmitter({ ...emitter, name: e.target.value })
                }
                placeholder="Raison sociale"
                className={`${inlineLight} text-center`}
              />
            </div>
            <input
              value={emitter.address}
              onChange={(e) =>
                setEmitter({ ...emitter, address: e.target.value })
              }
              placeholder="Adresse"
              className={`${inlineLight} mt-1 text-center text-[12px]`}
            />
            <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] opacity-90">
              <span>Tél.</span>
              <input
                type="tel"
                value={emitter.phone}
                onChange={(e) =>
                  setEmitter({ ...emitter, phone: e.target.value })
                }
                placeholder="(optionnel)"
                className={`${inlineLight} max-w-[180px] text-center`}
              />
            </div>
          </div>
        </div>

        {/* Corps du document */}
        <div className="flex flex-col gap-6 p-4 text-[13px] sm:p-6">
          {/* En-tête facture (gauche) + client (droite) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="text-lg font-bold">FACTURE</h2>
              <Field label="Date Facture :">
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={inlineDark}
                />
              </Field>
              <Field label="N° Facture :">
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className={inlineDark}
                />
              </Field>
              <Field label="Date limite de règlement :">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    setDueDateOverridden(true);
                  }}
                  className={inlineDark}
                />
              </Field>
            </div>

            <div className="border-neutral-300 flex w-full flex-col gap-1 rounded border p-3 text-center sm:w-[280px]">
              <span className="text-[10px] tracking-wide text-neutral-500 uppercase">
                N° TAHITI, NOM ET ADRESSE DU CLIENT
              </span>
              <input
                value={client.tahitiNumber}
                onChange={(e) =>
                  setClient({ ...client, tahitiNumber: e.target.value })
                }
                placeholder="N° TAHITI (optionnel)"
                className={`${inlineDark} text-center`}
              />
              <input
                value={client.name}
                onChange={(e) =>
                  setClient({ ...client, name: e.target.value })
                }
                placeholder="Nom du client"
                className={`${inlineDark} text-center font-medium`}
              />
              <input
                value={client.address}
                onChange={(e) =>
                  setClient({ ...client, address: e.target.value })
                }
                placeholder="Adresse"
                className={`${inlineDark} text-center`}
              />
            </div>
          </div>

          {/* Tableau lignes — scroll horizontal sur mobile (9 colonnes) */}
          <div className="-mx-4 overflow-x-auto sm:mx-0">
          <div className="border-neutral-300 min-w-[700px] overflow-hidden rounded border sm:min-w-0">
            <div className="bg-neutral-100 text-neutral-600 flex text-[10px] font-bold tracking-wide uppercase">
              <Cell w="14%">Date</Cell>
              <Cell w="32%">Désignation</Cell>
              <Cell w="10%" right>Qté</Cell>
              <Cell w="14%" right>Prix unit. HT</Cell>
              <Cell w="8%" center>HT/TTC</Cell>
              <Cell w="8%" center>TVA</Cell>
              <Cell w="6%" right>% Rem</Cell>
              <Cell w="8%" center>CPS</Cell>
              <Cell w="14%" right>Total HT</Cell>
            </div>
            {lines.map((l, i) => {
              const lineHT = preview?.lines[i]?.lineTotalHT ?? 0;
              return (
                <div
                  key={i}
                  className="border-neutral-200 group flex items-center border-t text-[12px]"
                >
                  <Cell w="14%">
                    <input
                      type="date"
                      value={issueDate}
                      readOnly
                      className={`${inlineDark} cursor-not-allowed text-[11px] text-neutral-500`}
                      title="Auto-rempli avec la date de la facture"
                    />
                  </Cell>
                  <Cell w="32%">
                    <input
                      value={l.description}
                      onChange={(e) =>
                        setLine(i, { description: e.target.value })
                      }
                      placeholder="Désignation"
                      className={inlineDark}
                    />
                  </Cell>
                  <Cell w="10%" right>
                    <input
                      type="number"
                      step="any"
                      value={l.quantity}
                      onChange={(e) =>
                        setLine(i, { quantity: e.target.value })
                      }
                      className={`${inlineDark} text-right`}
                    />
                  </Cell>
                  <Cell w="14%" right>
                    <input
                      type="number"
                      step="any"
                      value={l.unitPrice}
                      onChange={(e) =>
                        setLine(i, { unitPrice: e.target.value })
                      }
                      className={`${inlineDark} text-right`}
                    />
                  </Cell>
                  <Cell w="8%" center>
                    <select
                      value={l.priceInputMode}
                      onChange={(e) =>
                        setLine(i, {
                          priceInputMode: e.target.value as "HT" | "TTC",
                        })
                      }
                      className={`${inlineDark} text-center`}
                    >
                      <option value="HT">HT</option>
                      <option value="TTC">TTC</option>
                    </select>
                  </Cell>
                  <Cell w="8%" center>
                    <select
                      value={isFranchise ? "0" : l.vatRate}
                      onChange={(e) =>
                        setLine(i, { vatRate: e.target.value })
                      }
                      disabled={isFranchise}
                      className={`${inlineDark} text-center disabled:opacity-50`}
                    >
                      <option value="0">0 %</option>
                      <option value="0.05">5 %</option>
                      <option value="0.13">13 %</option>
                      <option value="0.16">16 %</option>
                    </select>
                  </Cell>
                  <Cell w="6%" right>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={l.discountPercent}
                      onChange={(e) =>
                        setLine(i, { discountPercent: e.target.value })
                      }
                      className={`${inlineDark} text-right`}
                    />
                  </Cell>
                  <Cell w="8%" center>
                    <select
                      value={l.cpsRate}
                      onChange={(e) =>
                        setLine(i, { cpsRate: e.target.value })
                      }
                      className={`${inlineDark} text-center`}
                    >
                      <option value="0">0 %</option>
                      <option value="0.01">1 %</option>
                    </select>
                  </Cell>
                  <Cell w="14%" right>
                    <span className="block px-1 text-right tabular-nums">
                      {fmtNum(lineHT)}
                    </span>
                  </Cell>
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLines((ls) => ls.filter((_, idx) => idx !== i))
                      }
                      aria-label="Supprimer la ligne"
                      className="absolute -translate-x-7 rounded p-1 text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-200 hover:text-neutral-900"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            })}
            <div className="border-neutral-200 border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setLines((ls) => [...ls, { ...emptyLine }])
                }
                className="w-full justify-center text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Plus className="size-4" /> Ajouter une ligne
              </Button>
            </div>
          </div>
          </div>

          {/* Blocs bas : TVA + CPS à gauche, Totaux à droite */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-3">
              {/* Bloc TVA */}
              <div className="border-neutral-300 overflow-hidden rounded border text-[11px]">
                <div className="bg-neutral-100 text-neutral-600 flex font-bold tracking-wide uppercase">
                  <Cell w="40%" right>Base H.T</Cell>
                  <Cell w="20%" center>Taux</Cell>
                  <Cell w="40%" right>Montant taxe</Cell>
                </div>
                {vatRatesOrdered.map((rate) => {
                  const b = vatBucketByRate.get(rate);
                  return (
                    <div
                      key={`vat-${rate}`}
                      className="border-neutral-200 flex border-t"
                    >
                      <Cell w="40%" right>{b ? fmtNum(b.baseHT) : ""}</Cell>
                      <Cell w="20%" center>{Math.round(rate * 100)}</Cell>
                      <Cell w="40%" right>
                        {b ? fmtNum(b.vatAmount) : ""}
                      </Cell>
                    </div>
                  );
                })}
                <div className="bg-neutral-100 border-neutral-300 flex border-t font-semibold">
                  <Cell w="40%">Montant total TVA</Cell>
                  <Cell w="20%"></Cell>
                  <Cell w="40%" right>
                    {fmtNum(preview?.totalVAT ?? 0)}
                  </Cell>
                </div>
              </div>

              {/* Bloc CPS */}
              <div className="border-neutral-300 overflow-hidden rounded border text-[11px]">
                <div className="bg-neutral-100 text-neutral-600 flex font-bold tracking-wide uppercase">
                  <Cell w="40%" right>Base H.T</Cell>
                  <Cell w="20%" center>CPS</Cell>
                  <Cell w="40%" right>Montant</Cell>
                </div>
                {PF_ALLOWED_CPS_RATES.map((rate) => {
                  const b = cpsBucketByRate.get(rate);
                  return (
                    <div
                      key={`cps-${rate}`}
                      className="border-neutral-200 flex border-t"
                    >
                      <Cell w="40%" right>{b ? fmtNum(b.baseHT) : ""}</Cell>
                      <Cell w="20%" center>{Math.round(rate * 100)}</Cell>
                      <Cell w="40%" right>
                        {b ? fmtNum(b.cpsAmount) : ""}
                      </Cell>
                    </div>
                  );
                })}
                <div className="bg-neutral-100 border-neutral-300 flex border-t font-semibold">
                  <Cell w="40%">Montant total CPS</Cell>
                  <Cell w="20%"></Cell>
                  <Cell w="40%" right>
                    {fmtNum(preview?.totalCPS ?? 0)}
                  </Cell>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col sm:w-[40%]">
              <div className="border-neutral-300 overflow-hidden rounded border">
                <div className="border-neutral-200 flex justify-between border-b px-3 py-2">
                  <span className="font-medium">TOTAL FACTURE HORS TAXES</span>
                  <span className="tabular-nums">
                    {fmtXpf(preview?.totalHT ?? 0)}
                  </span>
                </div>
                <div className="bg-neutral-100 flex justify-between px-3 py-3 text-base font-bold">
                  <span>TOTAL FACTURE T.T.C</span>
                  <span className="tabular-nums">
                    {fmtXpf(preview?.totalTTC ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mention franchise éventuelle */}
          {preview?.legalMention ? (
            <p className="text-center text-[11px] text-neutral-500 italic">
              {preview.legalMention}
            </p>
          ) : null}

          {/* Pied de page légal */}
          <p className="text-center text-[10px] text-neutral-500">
            {LEGAL_FOOTER}
          </p>
        </div>
      </div>

      {/* Action de téléchargement — sticky bas de viewport */}
      <div className="bg-background/85 border-border sticky bottom-2 z-20 flex w-full max-w-[900px] flex-col gap-2 rounded-md border px-3 py-2 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p className="text-muted-foreground hidden text-xs sm:block">
          Vos informations entreprise (logo inclus) sont mémorisées dans votre
          navigateur. Aucune donnée n'est envoyée à un serveur avant le
          téléchargement.
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleNewInvoice}
            className="w-full sm:w-auto"
          >
            Nouvelle facture
          </Button>
          <Button
            size="lg"
            disabled={loading}
            onClick={handleDownload}
            className="w-full sm:w-auto"
          >
            {loading ? "Génération…" : "Télécharger le PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Petit helper pour les libellés/champs alignés
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-32 shrink-0 text-[12px] font-semibold sm:w-44">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Cellule de tableau (largeur en %)
function Cell({
  children,
  w,
  right,
  center,
}: {
  children?: React.ReactNode;
  w: string;
  right?: boolean;
  center?: boolean;
}) {
  return (
    <div
      style={{ width: w }}
      className={`px-2 py-1.5 ${right ? "text-right" : center ? "text-center" : ""}`}
    >
      {children}
    </div>
  );
}
