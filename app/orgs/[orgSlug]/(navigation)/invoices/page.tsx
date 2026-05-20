import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import { InvoiceList } from "@/features/invoice/invoice-list";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { getInvoices } from "@/query/invoice/get-invoices";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function Page(props: PageProps<"/orgs/[orgSlug]/invoices">) {
  return (
    <Suspense fallback={null}>
      <RoutePage {...props} />
    </Suspense>
  );
}

async function RoutePage(props: PageProps<"/orgs/[orgSlug]/invoices">) {
  const params = await props.params;
  const { id: orgId } = await getRequiredCurrentOrgCache();
  const invoices = await getInvoices(orgId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="h1" className="text-2xl font-semibold">
            Factures
          </Typography>
          <Typography variant="muted" className="text-sm">
            Historique et suivi des paiements.
          </Typography>
        </div>
        <Link
          href={`/orgs/${params.orgSlug}/invoices/new`}
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="size-4" /> Nouvelle facture
        </Link>
      </div>
      <InvoiceList invoices={invoices} />
    </div>
  );
}
