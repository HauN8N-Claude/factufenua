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
import { upfetch } from "@/lib/up-fetch";
import { computeInvoice, type TaxRegime } from "@/lib/tax/pf";
import { PublicInvoiceSchema } from "./public-invoice.schema";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EMITTER_KEY = "factufenua:emitter";

type Emitter = {
  name: string;
  tahitiNumber: string;
  address: string;
  taxRegime: TaxRegime;
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

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Ajoute des jours à une date ISO (YYYY-MM-DD). */
const addDaysIso = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const PublicInvoiceGenerator = () => {
  const [emitter, setEmitter] = useState<Emitter>({
    name: "",
    tahitiNumber: "",
    address: "",
    taxRegime: "FRANCHISE",
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
  // Échéance par défaut = facture + 30 jours (modifiable).
  // On garde un flag pour recalculer tant que l'utilisateur ne l'a pas
  // explicitement modifiée.
  const [dueDate, setDueDate] = useState(addDaysIso(initialIssue, 30));
  const [dueDateOverridden, setDueDateOverridden] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Si l'utilisateur n'a pas touché à l'échéance, on la garde à +30 jours
  // quand il modifie la date de facture.
  useEffect(() => {
    if (!dueDateOverridden && issueDate) {
      setDueDate(addDaysIso(issueDate, 30));
    }
  }, [issueDate, dueDateOverridden]);

  // Nettoyage de l'URL blob pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // Pré-remplissage émetteur depuis le navigateur (aucune donnée serveur)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EMITTER_KEY);
      if (raw) setEmitter((e) => ({ ...e, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

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

  const handleGenerate = async () => {
    const payload = {
      emitter,
      client,
      number,
      issueDate,
      dueDate,
      lines: lines.map((l) => ({
        description: l.description,
        // Date opération non demandée à l'utilisateur — par défaut = date facture
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
      toast.error(
        parsed.error.issues[0]?.message ?? "Formulaire incomplet.",
      );
      return;
    }

    try {
      localStorage.setItem(EMITTER_KEY, JSON.stringify(emitter));
    } catch {
      /* ignore */
    }

    setLoading(true);
    try {
      const blob = await upfetch("/api/public/invoice-pdf", {
        method: "POST",
        body: parsed.data,
        parseResponse: async (res) => res.blob(),
      });
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob as Blob));
      toast.success("Facture générée. Vérifiez l'aperçu puis téléchargez.");
    } catch {
      toast.error("Échec de la génération du PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `facture-${number}.pdf`;
    a.click();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Votre entreprise (émetteur)</CardTitle>
          <CardDescription>
            Mémorisé dans votre navigateur pour la prochaine fois — aucune
            donnée n'est envoyée à un serveur.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Raison sociale</Label>
            <Input
              value={emitter.name}
              onChange={(e) =>
                setEmitter({ ...emitter, name: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Numéro TAHITI (ex. T12345)</Label>
            <Input
              value={emitter.tahitiNumber}
              onChange={(e) =>
                setEmitter({ ...emitter, tahitiNumber: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Adresse</Label>
            <Input
              value={emitter.address}
              onChange={(e) =>
                setEmitter({ ...emitter, address: e.target.value })
              }
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
                <SelectItem value="ASSUJETTI_TVA">
                  Assujetti à la TVA
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>Facture</CardTitle>
          <CardDescription>
            Vous gérez votre propre numérotation (séquence continue conseillée).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>Numéro de facture</Label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
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

      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          {preview ? (
            <div className="flex flex-col gap-1 text-sm">
              {preview.vatBuckets.map((b) => (
                <div
                  key={b.vatRate}
                  className="text-muted-foreground flex justify-between"
                >
                  <span>Base HT {Math.round(b.vatRate * 100)} %</span>
                  <span>{fmtXpf(b.baseHT)}</span>
                </div>
              ))}
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
              {preview.legalMention ? (
                <p className="text-muted-foreground mt-2 text-xs">
                  {preview.legalMention}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Complétez les lignes pour voir l'aperçu.
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        disabled={loading}
        onClick={handleGenerate}
      >
        {loading
          ? "Génération…"
          : pdfUrl
            ? "Régénérer l'aperçu"
            : "Générer la facture"}
      </Button>

      {pdfUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de la facture</CardTitle>
            <CardDescription>
              Vérifiez la facture ci-dessous, puis téléchargez-la.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <iframe
              src={pdfUrl}
              title="Aperçu de la facture"
              className="h-[70vh] w-full rounded-md border"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="sm:flex-1" onClick={handleDownload}>
                Télécharger le PDF
              </Button>
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => {
                  URL.revokeObjectURL(pdfUrl);
                  setPdfUrl(null);
                }}
              >
                Modifier la facture
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
