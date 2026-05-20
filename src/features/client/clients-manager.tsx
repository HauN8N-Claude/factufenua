"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import type { ClientListItem } from "@/query/client/get-clients";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteClientAction } from "./client.action";
import { ClientForm } from "./client-form";

type ClientsManagerProps = {
  clients: ClientListItem[];
};

export const ClientsManager = ({ clients }: ClientsManagerProps) => {
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      resolveActionResult(deleteClientAction({ id })),
    onSuccess: () => {
      toast.success("Client supprimé.");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const openEdit = (client: ClientListItem) => {
    dialogManager.custom({
      title: "Modifier le client",
      size: "md",
      children: (
        <ClientForm
          clientId={client.id}
          defaultValues={{
            name: client.name,
            tahitiNumber: client.tahitiNumber ?? "",
            address: client.address,
          }}
          onDone={() => dialogManager.closeAll()}
        />
      ),
    });
  };

  const confirmDelete = (client: ClientListItem) => {
    dialogManager.confirm({
      title: "Supprimer le client",
      description: `Supprimer définitivement « ${client.name} » ?`,
      variant: "destructive",
      action: {
        label: "Supprimer",
        onClick: async () => {
          await deleteMutation.mutateAsync(client.id);
        },
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouveau client</CardTitle>
          <CardDescription>
            Enregistrez vos clients pour les réutiliser sur vos factures sans
            ressaisie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun client pour l'instant. Ajoutez votre premier client
              ci-dessus.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {client.tahitiNumber
                        ? `${client.tahitiNumber} · `
                        : ""}
                      {client.address}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEdit(client)}
                      aria-label="Modifier"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => confirmDelete(client)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
