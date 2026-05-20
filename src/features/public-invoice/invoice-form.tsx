"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeInvoice, type TaxRegime } from "@/lib/tax/pf";
import { ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PublicInvoiceSchema } from "./public-invoice.schema";

/**
 * Formulaire de saisie classique. L'utilisateur remplit toutes les infos,
 * puis soumet — la facture en cours est sauvée en localStorage et il est
 * redirigé vers /facture (éditeur WYSIWYG) pour modifier puis télécharger.
 */

const EMITTER_KEY = "factufenua:emitter";
const CURRENT_INVOICE_KEY = "factufenua:current-invoice";
const LOGO_MAX_BYTES = 500_000;

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

const todayIso = () => new Date().toISOString().slice(0, 10);
const addDaysIso = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const fmtXpf = (n: number) =>
  `${new Intl.NumberFormat("fr-FR").format(n)} XPF`;

export const InvoiceForm = () => {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pré-remplir l'émetteur depuis le localStorage
  // Pattern de synchro état React ↔ stockage navigateur : on hydrate au
  // premier rendu côté client. Légitime malgré l'avertissement React 19.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EMITTER_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setEmitter((e) => ({ ...e, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  // Si l'échéance n'a pas été manuellement modifiée, la garder à +30 jours
  // de la date de facture (resync). Dérivation conditionnelle d'état
  // contrôlée par un flag utilisateur (`dueDateOverridden`) — ne peut pas
  // être un simple derived value sans casser le mode override manuel.
  useEffect(() => {
    if (!dueDateOverridden && issueDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDueDate(addDaysIso(issueDate, 30));
    }
  }, [issueDate, dueDateOverridden]);

  const isFranchise = emitter.taxRegime === "FRANCHISE";

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

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

  const handleSubmit = () => {
    const payload = {
      emitter,
      client,
      number,
      issueDate,
      dueDate,
      lines: lines.map((l) => ({
        description: l.description,
        dateOperation: issueDate,
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

    try {
      localStorage.setItem(EMITTER_KEY, JSON.stringify(emitter));
      // On sauve la facture en cours sous forme "brute" (avec les types
      // chaînes du formulaire), l'éditeur les ré-utilisera tels quels.
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
      toast.error("Impossible d'enregistrer la facture (stockage navigateur).");
      return;
    }

    router.push("/editeur");
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Émetteur */}
      <Card>
        <CardHeader>
          <CardTitle>Votre entreprise (émetteur)</CardTitle>
          <CardDescription>
            Mémorisé dans votre navigateur — vous ne le saisirez qu'une fois.
            Aucune donnée n'est envoyée à un serveur.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="bg-muted relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border">
              {emitter.logoDataUrl ? (
                <>
                  <img
                    src={emitter.logoDataUrl}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    aria-label="Retirer le logo"
                    onClick={() =>
                      setEmitter({ ...emitter, logoDataUrl: "" })
                    }
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                  >
                    <X className="size-3" />
                  </button>
                </>
              ) : (
                <ImageIcon className="text-muted-foreground size-6" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Logo (optionnel)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {emitter.logoDataUrl ? "Changer le logo" : "Choisir un logo"}
              </Button>
              <span className="text-muted-foreground text-xs">
                PNG / JPG / SVG, max 500 Ko.
              </span>
            </div>
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

          <div className="flex flex-col gap-2">
            <Label>Raison sociale</Label>
            <Input
              value={emitter.name}
              onChange={(e) =>
                setEmitter({ ...emitter, name: e.target.value })
              }
              placeholder="Ex. Société Test Polynésie"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Numéro TAHITI (ex. T12345)</Label>
            <Input
              value={emitter.tahitiNumber}
              onChange={(e) =>
                setEmitter({ ...emitter, tahitiNumber: e.target.value })
              }
              placeholder="T12345"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Adresse</Label>
            <Input
              value={emitter.address}
              onChange={(e) =>
                setEmitter({ ...emitter, address: e.target.value })
              }
              placeholder="Adresse complète"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Téléphone (optionnel)</Label>
            <Input
              type="tel"
              value={emitter.phone}
              onChange={(e) =>
                setEmitter({ ...emitter, phone: e.target.value })
              }
              placeholder="Ex. 40 12 34 56"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Régime fiscal</Label>
            <Select
              value={emitter.taxRegime}
              onValueChange={(v) =>
                setEmitter({ ...emitter, taxRegime: v as TaxRegime })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FRANCHISE">
                  Franchise en base (≤ 5 000 000 XPF/an)
                </SelectItem>
                <SelectItem value="ASSUJETTI_TVA">Assujetti à la TVA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Client */}
      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Nom / raison sociale</Label>
            <Input
              value={client.name}
              onChange={(e) =>
                setClient({ ...client, name: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Numéro TAHITI (optionnel)</Label>
            <Input
              value={client.tahitiNumber}
              onChange={(e) =>
                setClient({ ...client, tahitiNumber: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Adresse</Label>
            <Input
              value={client.address}
              onChange={(e) =>
                setClient({ ...client, address: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Facture (numéro, date, échéance) */}
      <Card>
        <CardHeader>
          <CardTitle>Facture</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>Numéro de facture</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Date de la facture</Label>
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Date limite (échéance)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setDueDateOverridden(true);
              }}
            />
            {!dueDateOverridden ? (
              <span className="text-muted-foreground text-xs">
                Par défaut : 30 jours après la facture.
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Lignes */}
      <Card>
        <CardHeader>
          <CardTitle>Lignes</CardTitle>
          <CardDescription>
            Saisissez le prix en HT ou TTC : le calcul s'ajuste.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {lines.map((line, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 border-b pb-4 last:border-b-0"
            >
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Input
                  value={line.description}
                  onChange={(e) =>
                    setLine(i, { description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col gap-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    step="any"
                    value={line.quantity}
                    onChange={(e) =>
                      setLine(i, { quantity: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Prix unitaire (XPF)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLine(i, { unitPrice: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Mode</Label>
                  <Select
                    value={line.priceInputMode}
                    onValueChange={(v) =>
                      setLine(i, { priceInputMode: v as "HT" | "TTC" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HT">HT</SelectItem>
                      <SelectItem value="TTC">TTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>TVA</Label>
                  <Select
                    value={isFranchise ? "0" : line.vatRate}
                    onValueChange={(v) => setLine(i, { vatRate: v })}
                    disabled={isFranchise}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 %</SelectItem>
                      <SelectItem value="0.05">5 %</SelectItem>
                      <SelectItem value="0.13">13 %</SelectItem>
                      <SelectItem value="0.16">16 %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-xs">
                    Remise % (optionnel)
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={line.discountPercent}
                    onChange={(e) =>
                      setLine(i, { discountPercent: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-xs">
                    CPS (optionnel)
                  </Label>
                  <Select
                    value={line.cpsRate}
                    onValueChange={(v) => setLine(i, { cpsRate: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 %</SelectItem>
                      <SelectItem value="0.01">1 %</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {lines.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() =>
                    setLines((ls) => ls.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="size-4" /> Retirer
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setLines((ls) => [...ls, { ...emptyLine }])}
          >
            <Plus className="size-4" /> Ajouter une ligne
          </Button>
        </CardContent>
      </Card>

      {/* Aperçu totaux */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          {preview ? (
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span>Total HT</span>
                <span>{fmtXpf(preview.totalHT)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA</span>
                <span>{fmtXpf(preview.totalVAT)}</span>
              </div>
              {preview.totalCPS > 0 ? (
                <div className="flex justify-between">
                  <span>CPS</span>
                  <span>{fmtXpf(preview.totalCPS)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-semibold">
                <span>Total TTC</span>
                <span>{fmtXpf(preview.totalTTC)}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Complétez les lignes pour voir l'aperçu.
            </p>
          )}
        </CardContent>
      </Card>

      <Button size="lg" className="w-full" onClick={handleSubmit}>
        Voir l'aperçu de ma facture
      </Button>
    </div>
  );
};
