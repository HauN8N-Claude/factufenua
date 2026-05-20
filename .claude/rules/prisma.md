---
paths:
  - "prisma/**/*"
---

# Prisma

Database layer using Prisma ORM with PostgreSQL.

## Commands

```bash
# Generate Prisma client after schema changes
pnpm prisma:generate   # ✅ Claude can run this

# Generate better-auth Prisma schema
pnpm better-auth:migrate
```

## Migration Rules

✅ **Claude IS allowed to run migrations** (per project owner decision, 2026-05-19).

- `pnpm prisma:migrate` / `prisma migrate dev` - ✅ Claude can run this
- `pnpm prisma:deploy` / `prisma migrate deploy` - ✅ Claude can run this
- `pnpm prisma:generate` - ✅ Claude can run this

Claude may modify the schema, run `prisma:generate`, AND run migrations
directly. Always report the result. Verify connectivity first if a network
change is suspected.

⚠️ **Known issue on this machine:** `prisma migrate dev` crashes with
`VirtualAlloc failed` (engine too memory-heavy). Reliable workaround:

```bash
# 1. Generate SQL from live DB -> target schema
prisma migrate diff --from-config-datasource --to-schema prisma --script > /tmp/m.sql
# 2. Create migration folder prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql
# 3. Apply (lightweight, works):
prisma migrate deploy
```

`prisma migrate deploy` and `prisma:generate` work fine; only `migrate dev`
fails. `migrate deploy` may occasionally exit non-zero on a transient glitch —
retry once and check `prisma migrate status`.

## Schema Location

- `prisma/schema.prisma` - Database schema definition

## Usage Patterns

- Organization-based data access patterns
- Database hooks for user creation setup
- All models should follow existing naming conventions in schema

## 🔴 CRITICAL - Security Rules

**ALWAYS filter by `organizationId`** when querying/updating/deleting organization-scoped data:

```ts
// ✅ CORRECT - Always include organizationId in where clause
const data = await prisma.member.findMany({
  where: {
    organizationId: org.id, // MANDATORY for security
  },
});

// ❌ WRONG - Missing organizationId allows cross-org data access
const data = await prisma.member.findMany({
  where: { userId: userId },
});
```

**ALWAYS verify user membership** before accessing org data:

```ts
// Use getRequiredCurrentOrg() or getRequiredCurrentOrgCache()
// These verify the user belongs to the organization
const org = await getRequiredCurrentOrg();

// Then use org.id in your queries
const members = await prisma.member.findMany({
  where: { organizationId: org.id },
});
```

## Performance - Use `select` Over `include`

**Prefer `select`** to fetch only needed fields and reduce data transfer:

```ts
// ✅ CORRECT - Select only needed fields
return prisma.member.findMany({
  where: { organizationId: orgId },
  select: {
    id: true,
    role: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    },
  },
});

// ❌ AVOID - include fetches entire related records
return prisma.member.findMany({
  where: { organizationId: orgId },
  include: { user: true }, // Fetches ALL user fields
});
```

## Codebase Patterns

Follow existing patterns in `src/query/`:

```ts
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

// Define reusable select/include objects with satisfies
const memberSelect = {
  id: true,
  role: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.MemberSelect;

// Export return types using Prisma.PromiseReturnType
export type MemberWithUser = Prisma.PromiseReturnType<typeof getMembers>;
```

## Workflow

1. Modify `prisma/schema.prisma` as needed
2. Run `pnpm prisma:generate` to update the client
3. Run `prisma migrate dev --name <description>` to apply the migration
4. Report the migration result (and any error) to the user
