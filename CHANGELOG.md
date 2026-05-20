# Changelog

## 2026-05-20

FIX: CGU — replace <a> with next/link Link (no-html-link-for-pages)
FEATURE: CGU — identification éditeur (PolynetIA F95709) section Objet + nouvelle section Contact (contact@polynetia.com)
CHORE: Add .gitattributes (force LF) + .editorconfig (LF, utf-8, 2 spaces)
CHORE: Run pnpm lint --fix — normalise tous les line endings CRLF → LF
FIX: pf.ts — retire `?? 0` redondant sur line.cpsRate (déjà typé non-nullable après enrichissement)
CHORE: Silence 3 faux positifs lint legitimes (closure-mutated `revoked` flag, set-state-in-effect pour hydratation localStorage et resync dueDate)
REFACTOR: Editeur facture — revert layout interne du document au format A4 classique (TVA+CPS empilés à gauche, Totaux à droite, paddings/gaps généreux) ; on garde sticky buttons et padding de page compact
CHORE: Fill editor info in /mentions-legales and /confidentialite (PolynetIA EI, N° TAHITI F95709, Punaauia, contact@polynetia.com) — remove TBD placeholders
CHORE: Update SiteConfig — prodUrl/domain factufenua.pf → factufenua.com, company.name/address set to PolynetIA / Punaauia
FEATURE: Add legal pages — /mentions-legales, /cgu, /confidentialite (RGPD-compliant, copy adapted to no-cookie / no-DB MVP)
FEATURE: Footer — add Mentions légales / CGU / Confidentialité links
FEATURE: Add @vercel/analytics in app/layout.tsx (anonymous, no cookie banner needed)
FEATURE: SEO — proper Metadata on home (title FR, description, keywords PF, OG, Twitter card, canonical)
FEATURE: Add app/robots.ts — noindex /admin, /auth, /orgs, /home, /api ; sitemap pointer
REFACTOR: Fix sitemap.tsx — replace codeline.app URLs with SiteConfig.prodUrl ; static lastModified for Next 16 cacheComponents
CHORE: SiteConfig.features.enableLandingRedirection forced to false (MVP no-auth — never redirect away from /)
FEATURE: E2E test e2e/public-invoice.spec.ts — landing → editor → PDF download + legal pages + robots/sitemap
REFACTOR: Editeur facture — compact layout (TVA/CPS/Totaux en 3 colonnes, paddings/gaps réduits, boutons d'action en sticky bas de viewport) pour limiter le scroll vertical

## 2026-05-19

CHORE: Initialize FactuFenua project from NOW.TS boilerplate (Task 01)
CHORE: Configure .env (Neon PostgreSQL, Upstash Redis, Better-Auth secret)
FEATURE: Rebrand site config to FactuFenua (générateur de factures Polynésie française)
CHORE: Disable GitHub/Google OAuth (email + password auth only for MVP)
FEATURE: Add PF tax engine src/lib/tax/pf.ts (versioned VAT table 5/13/16%, XPF, franchise, HT/TTC, Tahiti number) — Task 02
FEATURE: Add 26 unit tests for PF tax engine (__tests__/tax-pf.test.ts)
FEATURE: Add Prisma models Company/Client/Invoice/InvoiceLine (org-scoped, XPF) — Task 03
CHORE: Apply migration 20260519060000_factufenua_models to database
CHORE: Allow Claude to run Prisma migrations (.claude/rules/prisma.md) per owner decision
FEATURE: Add company profile (onboarding) — schema, upsert server action, TanStack form, page, nav link — Task 04
FEATURE: Add client address book CRUD (org-scoped, delete blocked if invoices, edit dialog) — Task 05
FEATURE: Replace NOW.TS demo landing with FactuFenua hero + features (no gradient, FR copy) — Task 10 (partiel)
FEATURE: Replace demo dashboard with FactuFenua overview (company status + quick links to company/clients)
REFACTOR: Make Stripe/Resend signup hooks non-fatal in MVP (deferred to premium)
FEATURE: Invoice creation — transactional sequential numbering + fiscal snapshot (ADR-001/003) — Task 06
FEATURE: Invoice form UI — dynamic lines, HT/TTC toggle, live tax preview — Task 07
FEATURE: Conformant invoice PDF via @react-pdf/renderer + secured API route — Task 08
FEATURE: Invoice history + paid/unpaid status toggle, nav link — Task 09
FEATURE: PIVOT — public no-auth stateless invoice generator at /facture (emitter in localStorage, user-set number, public PDF API) — landing CTAs point to it
FIX: Remove `export const runtime` from PDF routes (incompatible with Next 16 cacheComponents)
REFACTOR: Simplify footer — remove NOW.TS demo link columns, keep brand + copyright
FEATURE: Public generator — "Générer la facture" shows embedded PDF preview before download (Télécharger / Modifier)
REFACTOR: Landing header — center logo, remove Features/Pricing/Blog/Sign in nav
FEATURE: /facture shows invoice template preview (sample data) only — form generator temporarily disabled (reversible)
FIX: Footer crashed /facture — replace new Date() with static year (forbidden in Server Component under Next 16 cacheComponents)
CHORE: next.config — ignore typecheck/lint during build (run separately; machine too slow for in-build TS)
FEATURE: Tax engine — add discountPercent, cpsRate (0/1%), dateOperation per line; new totalCPS + cpsBuckets in result
FEATURE: PDF template aligned with official PF invoice — emitter banner, due date, date opération + % REM columns, TVA block always 4 rates, CPS block (0/1), totals HT/TTC right, mandatory footer mentions (escompte / pénalités 10% / indemnité 5000 F)
FEATURE: Public form — reactivated and updated for new fields. Smart defaults to keep it simple: due date auto = issue+30 (editable, resyncs if issue changes), per-line dateOperation auto = issue date (not asked to user), discount % and CPS optional per line. Preview shows CPS total when > 0.
FEATURE: WYSIWYG invoice editor — invoice IS the editor (large A4-style), all fields editable inline, logo upload (data URL stored in localStorage with size limit), no separate form. PDF generated only on download.

## 2026-03-05

CHORE: Upgrade all 58 dependencies to latest versions
FIX: Update better-auth 1.5.x API - rename organizationCreation to organizationHooks, afterCreate to afterCreateOrganization
FIX: Update better-auth 1.5.x API - rename sendChangeEmailVerification to sendChangeEmailConfirmation
FIX: Update better-auth 1.5.x API - rename permission to permissions in hasPermission calls
FIX: Update TanStack Store subscribe return type for proper useEffect cleanup
CHORE: Add @better-auth/prisma-adapter as direct dependency (required by better-auth 1.5.x)
CHORE: Keep ESLint at 9.x (plugins don't support ESLint 10 yet)

## 2026-02-16

FEATURE: Add /api/status route with optional random number query parameter
FEATURE: Add /api/status health check route
FEATURE: Add middleware redirect from /admin/interdit to /home

## 2026-01-24

FEATURE: Add "Dismiss all" button to changelog sidebar stack for dismissing multiple changelogs at once

## 2026-01-22

FEATURE: Add changelog system documentation in content/docs/changelog.mdx
FEATURE: Add add-documentation skill with SKILL.md and reference for creating documentation in content/docs/
FEATURE: Add documentation template and create-doc.sh script (mandatory for creating new docs)

## 2026-01-21

FIX: Free plan users now redirect to Stripe checkout instead of billing portal when upgrading

## 2026-01-19

FEATURE: Add x-org-slug header support for /api/orgs/* routes in middleware

## 2026-01-18

CHORE: Add Prisma security and performance rules (orgId filtering, select over include, codebase patterns)
FEATURE: Add domain question to init-project workflow for Resend email configuration (with/without domain support)

## 2026-01-13

CHORE: Remove 14 unused files including admin components, docs components, and utility files
CHORE: Remove 5 unused dependencies (@ai-sdk/openai, ai, @types/react-syntax-highlighter, radix-ui, ts-node) saving ~3MB
REFACTOR: Remove duplicated FileMetadata type from avatar-upload.tsx, import from use-file-upload.ts instead
REFACTOR: Replace session-based organization context with URL slug-based routing using middleware headers for multi-tab support
FIX: Update hasPermission to pass explicit organizationId for Better Auth compatibility
REFACTOR: Move legal and docs links from floating footer to minimal sidebar navigation above Settings button with text-xs

## 2026-01-02

REFACTOR: Add cacheLife("max") to docs, changelog, and posts pages for 30-day cache instead of 15-minute default
REFACTOR: Improve mobile nav user button to show avatar + name/email with dropdown instead of just avatar
FEATURE: Add responsive mobile navigation for documentation with sticky header and sheet sidebar
FIX: Fix documentation page horizontal overflow when description text is too long
FEATURE: Add /add-documentation slash command for creating and updating docs in content/docs/
REFACTOR: Add useDebugPanelAction and useDebugPanelInfo hooks for cleaner debug panel registration with automatic cleanup
FIX: Improve changelog dialog responsiveness on mobile with smaller padding and text sizes

## 2025-12-28

REFACTOR: Replace admin back button with breadcrumb navigation (matching org page style)

## 2025-12-27

REFACTOR: Merge billing info into single card with next payment date, amount, and payment method
FEATURE: Add "Create customer" button to auto-create Stripe customer for organizations
FEATURE: Add inline title editing with org avatar on admin organization detail page
FEATURE: Add coupon code support for admin subscription management (enables 100% off plans without payment method)
REFACTOR: Admin user organizations list uses badges for role and plan instead of text with dots
REFACTOR: Admin user organizations list uses proper ItemGroup pattern with separators and unified border
REFACTOR: Modernize admin subscription UI with plan cards, monthly/yearly toggle, and status indicators
REFACTOR: Feedback detail page uses Item component instead of Card for consistent styling
REFACTOR: Post detail page now matches changelog detail style - max-w-2xl layout, aspect-video image, badges with icons, prose content
REFACTOR: Simplify admin charts with Stripe-style design - hero numbers, no grid, cleaner layout
REFACTOR: Use dot style badges for status indicators in admin user sessions and providers tables
FEATURE: Add MRR growth and user growth charts to admin dashboard with Stripe data
REFACTOR: Remove 15 PostCard variants, keep single clean compact design
REFACTOR: Consolidate image upload components into unified ImageDropzone with avatar/square variants
REFACTOR: Unify sidebar trigger button style across all navigation components
REFACTOR: Add size="lg" to all admin dashboard pages for consistent layout width
CHORE: Add v2.1.0 changelog entry and update image paths
REFACTOR: Changelog timeline with vertical line on left, date labels, and compact cards
FEATURE: Add active state highlighting to content header navigation
FIX: Remove pulsing animation from changelog timeline first item
REFACTOR: Modernize changelog UI with docs-style header, footer, and blog post layout
REFACTOR: Changelog detail page now uses aspect-video image, cleaner badges, and prose styling
REFACTOR: Changelog list page uses card-based layout with hover effects and latest badge

## 2025-12-26

FEATURE: Changelog page timeline view with vertical timeline, version badges, and hover effects
CHORE: Add unit tests for changelog-manager and changelog actions
CHORE: Add E2E tests for changelog dialog flow
FIX: InterceptDialog uses router.refresh() after router.back() to reset parallel route slot state
FIX: InterceptDialog only calls router.back() when closing, not on every state change
FEATURE: Add "Reset Changelog" debug action to restore dismissed changelogs
FEATURE: Debug Panel with draggable/resizable UI, session info, and dynamic action buttons (dev only)
FEATURE: Public changelog system with CardStack animation and timeline UI
FEATURE: Changelog CardStack widget in organization sidebar
FEATURE: Intercepting routes for changelog dialog from any page
FEATURE: Claude Code slash command for creating changelog entries
FEATURE: Add reply button with textarea dialog on feedback detail page
FEATURE: Clickable user Item on feedback detail page navigates to user profile
REFACTOR: Replace feedback table with Item components for cleaner UI

## 2025-12-15

FIX: Remove insecure trusted origins wildcard configuration in auth
FIX: Use hard redirects for impersonation to update profile button immediately
FIX: Breadcrumb path selection slice issue
FIX: Typo in prisma:generate script
FIX: ESLint and TypeScript errors across codebase
FIX: Vitest config ESM conversion
FIX: generateStaticParams for posts in production (Next.js 16 compatibility)

FEATURE: Major performance improvements with refactored application architecture
FEATURE: TanStack Form migration replacing React Hook Form across all forms
FEATURE: Redis caching for improved performance
FEATURE: OTP-based password reset flow
FEATURE: Complete OTP sign-in flow implementation
FEATURE: Responsive provider buttons (full width when single provider)
FEATURE: Global PageProps type for standardized page component typing

REFACTOR: Middleware utilities extraction with admin route protection

CHORE: Update Better-Auth to version 1.3.27
CHORE: Update VSCode snippets and workflow configuration
CHORE: Add environment variables guide
CHORE: Improve type safety in chart and tooltip components
CHORE: Remove unused shadcn-prose dependency

## 2025-08-23

FEATURE: GridBackground component for customizable visual design
FEATURE: Admin feedback system with filters, tables, and detailed views
FEATURE: Documentation system with dynamic content and sidebar navigation
FEATURE: Last used provider tracking for enhanced sign-in experience
FEATURE: Contact and about pages

CHORE: Update Next.js to 15.5.0
CHORE: Update React to 19.1.1
CHORE: Update AI SDK to v5
CHORE: Update all Radix UI component packages
CHORE: Update testing dependencies and build tools
CHORE: Claude Code integration with new agents, commands, and formatting hooks
CHORE: Improve API file organization and documentation structure

## 2025-08-13

FEATURE: Complete admin dashboard with sidebar layout and routing
FEATURE: Admin-only authentication guards with role checking
FEATURE: User management interface with search, pagination, and role filtering
FEATURE: User detail pages with session management and impersonation
FEATURE: Organization management interface with member management
FEATURE: Subscription management with plan changes and billing controls
FEATURE: Payment history with Stripe integration for admin oversight
FEATURE: AutomaticPagination reusable component

REFACTOR: Move billing ownership from User to Organization level
REFACTOR: Migrate stripeCustomerId from User model to Organization model
REFACTOR: Update webhook handlers for organization-based billing
REFACTOR: Replace Better-Auth subscription methods with custom server actions
REFACTOR: Billing page with Card components and Typography

FIX: Remove all `any` type usage in Stripe webhook handlers
FIX: Type compatibility issues across billing system
FIX: Card hover effects replaced with clean styling
FIX: Organization/user names now clickable instead of separate View buttons

## 2025-07-14

FEATURE: Playwright workflow migrated to local CI testing with PostgreSQL service
FEATURE: Comprehensive logging throughout all E2E tests

REFACTOR: Migrate Prisma configuration from package.json to prisma.config.ts
REFACTOR: Rename RESEND_EMAIL_FROM to EMAIL_FROM

FIX: Delete account test case sensitivity issue
FIX: Button state validation and error handling in tests
FIX: External API dependency error catching for build
FIX: DATABASE_URL_UNPOOLED configuration for Prisma
FIX: OAuth secrets renamed (GITHUB to OAUTH_GITHUB)

CHORE: Add all required GitHub secrets for CI testing
CHORE: Enhance Playwright reporter configuration for CI visibility

## 2025-06-01

FEATURE: Orgs-list page to view organization list
FEATURE: Adapter system for email and image upload

FIX: API Error "No active organization"

CHORE: Upgrade libraries to latest versions

## 2025-05-03

FEATURE: NOW.TS deployed app tracker
FEATURE: Functional database seed

## 2025-04-17

FEATURE: Resend contact support

REFACTOR: Prisma with output directory
REFACTOR: Replace redirect method
REFACTOR: Update getOrg logic to avoid bugs

FIX: Navigation styles
FIX: Hydration error

CHORE: Upgrade to Next.js 15.3.0

## 2025-04-06

FEATURE: Better-Auth organization plugin
FEATURE: Better-Auth Stripe plugin
FEATURE: Better-Auth permissions
FEATURE: Middleware authentication handling

REFACTOR: Replace AuthJS with Better-Auth
REFACTOR: Upgrade to Tailwind V4
REFACTOR: Layout and pages upgrade

## 2024-09-12

FEATURE: NEXT_PUBLIC_EMAIL_CONTACT env variable
FEATURE: RESEND_EMAIL_FROM env variable

## 2024-09-08

FEATURE: Add slug to organizations
REFACTOR: Update URL with slug instead of id

## 2024-09-01

FEATURE: NOW.TS version 2 with organizations
