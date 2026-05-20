import { Layout, LayoutContent } from "@/features/page/layout";
import { SiteConfig } from "@/site-config";
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
];

export function Footer() {
  return (
    <footer className="bg-background border-t pb-8">
      <Layout className="my-14">
        <LayoutContent>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold tracking-tight">
                {SiteConfig.title}
              </h3>
              <p className="text-muted-foreground max-w-md text-sm">
                {SiteConfig.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <nav className="flex flex-wrap gap-4">
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <p className="text-muted-foreground text-sm">
                © 2026 {SiteConfig.company.name}
              </p>
            </div>
          </div>
        </LayoutContent>
      </Layout>
    </footer>
  );
}
