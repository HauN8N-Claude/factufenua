---
description: Add debug actions or info to the Debug Panel (dev-only)
allowed-tools: Read, Write, Edit, Glob, Grep
---

<objective>
Add custom debug actions or info to the Debug Panel. The Debug Panel is a development-only tool that displays useful information and provides quick action buttons.
</objective>

<overview>
The Debug Panel (`src/features/debug/`) provides:
- **Draggable & Resizable** floating panel (top-left)
- **Collapsed state**: Small circular badge showing Tailwind breakpoint
- **Expanded state**: Panel with info display and action buttons
- **Production-safe**: Returns `null` when `NODE_ENV === "production"`
- **Built-in info**: User email and session ID (when logged in)
</overview>

<api_reference>

## Import

```tsx
import {
  useDebugPanelAction,
  useDebugPanelInfo,
} from "@/features/debug";
```

## Types

```tsx
type DebugAction = {
  id: string; // Unique identifier
  label: string; // Button text
  onClick: () => void | Promise<void>; // Action handler (supports server actions)
  variant?: "default" | "destructive"; // Button style (default = outline, destructive = red)
};

type DebugInfo = {
  id: string; // Unique identifier
  label: string; // Info label
  value: string | number | boolean | null; // Displayed value
};
```

## Hooks

```tsx
// Register an action button (auto-cleanup on unmount)
useDebugPanelAction({
  id: "my-action",
  label: "My Action",
  onClick: () => { ... },
  variant: "default" | "destructive", // optional
});

// Register an info display (auto-cleanup on unmount)
useDebugPanelInfo({
  id: "my-info",
  label: "My Info",
  value: "some value",
});
```

</api_reference>

<patterns>
## Pattern 1: Add Action in a Client Component

```tsx
"use client";

import { useDebugPanelAction } from "@/features/debug";
import { useCallback } from "react";
import { clearCacheAction } from "./actions";

export function MyComponent() {
  const handleClearCache = useCallback(() => clearCacheAction(), []);

  useDebugPanelAction({
    id: "clear-cache",
    label: "Clear Cache",
    onClick: handleClearCache,
  });

  return <div>...</div>;
}
```

## Pattern 2: Add Info

```tsx
"use client";

import { useDebugPanelInfo } from "@/features/debug";

export function DebugEnvInfo() {
  useDebugPanelInfo({
    id: "env",
    label: "Environment",
    value: process.env.NODE_ENV ?? null,
  });

  useDebugPanelInfo({
    id: "build-id",
    label: "Build ID",
    value: process.env.NEXT_PUBLIC_BUILD_ID ?? "local",
  });

  return null;
}
```

## Pattern 3: Dynamic Info Updates

```tsx
"use client";

import { useDebugPanelInfo } from "@/features/debug";

export function DebugCounter({ count }: { count: number }) {
  useDebugPanelInfo({
    id: "counter",
    label: "Count",
    value: count,
  });

  return null;
}
```

## Pattern 4: Destructive Action

```tsx
"use client";

import { useDebugPanelAction } from "@/features/debug";
import { useCallback } from "react";
import { resetDatabaseAction } from "./actions";

export function DebugResetDb() {
  const handleResetDb = useCallback(async () => {
    await resetDatabaseAction();
  }, []);

  useDebugPanelAction({
    id: "reset-db",
    label: "Reset DB",
    variant: "destructive",
    onClick: handleResetDb,
  });

  return null;
}
```

## Pattern 5: Multiple Actions Component

```tsx
"use client";

import { useDebugPanelAction } from "@/features/debug";
import { useCallback } from "react";

export function DebugDataActions() {
  const handleSeedUsers = useCallback(() => seedUsersAction(), []);
  const handleClearCache = useCallback(() => clearCacheAction(), []);
  const handleResetDb = useCallback(() => resetDbAction(), []);

  useDebugPanelAction({ id: "seed-users", label: "Seed Users", onClick: handleSeedUsers });
  useDebugPanelAction({ id: "clear-cache", label: "Clear Cache", onClick: handleClearCache });
  useDebugPanelAction({ id: "reset-db", label: "Reset DB", onClick: handleResetDb, variant: "destructive" });

  return null;
}
```

</patterns>

<rules>
- ALWAYS use unique `id` values to avoid conflicts
- Use `useCallback` for onClick handlers to prevent unnecessary re-registrations
- Actions support async functions (loading state shown automatically)
- Use `variant: "destructive"` for dangerous actions
- The Debug Panel is only visible in development (`NODE_ENV !== "production"`)
- Server actions can be called directly in `onClick` handlers
- Cleanup is automatic - hooks handle registration and removal on unmount
</rules>

<process>
1. **Identify what to add**: Action (button) or Info (display value)
2. **Create a client component** with the appropriate hook (`useDebugPanelAction` or `useDebugPanelInfo`)
3. **Use unique IDs** to prevent conflicts
4. **Wrap callbacks in useCallback** for stable references
5. **Place the component** in the appropriate layout or page
</process>

<success_criteria>
- Action/Info appears in Debug Panel when component is mounted
- Action/Info is automatically removed when component unmounts
- Loading state works for async actions
- No duplicate IDs with existing debug items
</success_criteria>
