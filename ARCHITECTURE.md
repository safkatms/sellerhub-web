# SellerHub Web — Architecture

Admin console for the SellerHub platform (shops/tenants, plans, subscriptions, settings, logs, platform admins).
It is a client-rendered Next.js App Router app that talks to a separate REST API (`NEXT_PUBLIC_API_URL`).

## Stack

| Concern | Library |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19 |
| Server state | TanStack Query 5 |
| Client state | Zustand 5 (`persist` → localStorage) |
| HTTP | Axios |
| Forms / validation | react-hook-form + zod |
| Tables | TanStack Table 9 |
| UI | shadcn-style components on Base UI, Tailwind CSS 4, lucide icons, sonner toasts |
| Charts / dates | Recharts, dayjs (utc + timezone) |

## Folder layout

```
src/
├── app/                      ROUTING LAYER — URLs, layouts, providers only
│   ├── layout.tsx            <html>, global CSS, <Providers>
│   ├── providers.tsx         QueryClient, Tooltip, Toaster; calls setupApiAuth()
│   ├── page.tsx              "/" → redirect("/login")
│   ├── (auth)/login/page.tsx
│   └── (app)/                authenticated area
│       ├── layout.tsx        <AuthGuard> + sidebar shell
│       └── <feature>/…/page.tsx   one-line server components that render a feature screen
│
├── features/platform/<name>/ FEATURE LAYER — one folder per business area
│   ├── api.ts                types + raw requests + TanStack Query hooks (no UI)
│   ├── columns.tsx           table column definitions (presentation only)
│   ├── *-page.tsx            screens ("use client"): forms, tables, dialogs, toasts
│   └── *.tsx                 feature-private components (dialogs, cells…)
│
├── components/
│   ├── ui/                   design-system primitives (no app knowledge)
│   ├── data-table.tsx        generic table with sort headers + pager
│   └── app-sidebar.tsx       app shell navigation
│
├── hooks/                    generic React hooks (use-local-table, use-mobile)
└── lib/                      INFRASTRUCTURE — framework-agnostic helpers
    ├── api/client.ts         axios instance + pluggable auth interceptors
    ├── api/errors.ts         ProblemDetails parsing → form errors / toasts
    ├── api/types.ts          shared API envelope types (Paged, ProblemDetails)
    ├── enums.ts, dayjs.ts, table.ts, utils.ts
```

Features: `auth`, `dashboard`, `tenants` (UI label "Shops"), `plans`, `settings`, `logs`, `admins`.

## Layer rules

Dependencies point **downwards only**:

```
app (routes)  →  features  →  components / hooks  →  lib
                    │                               ↑
                    └───────────────────────────────┘
```

1. **`lib/` imports nothing from the app.** No stores, features, routes or UI components. The API client
   knows no endpoints and no store; auth behaviour is injected through `configureApiAuth()`.
2. **`components/ui/` knows nothing about the domain.** The only `components/` file that touches a feature
   is the app shell (`app-sidebar.tsx` → `useSignOut`).
3. **`app/**/page.tsx` holds no logic.** It reads route params and renders one feature screen. Pages are
   server components; the screen they render is the `"use client"` boundary.
4. **`features/platform/*/api.ts` is the data layer.** It owns DTO types, endpoints, query keys and cache
   invalidation. It must not show toasts, navigate, or touch forms. Success/error feedback is the
   screen's job (`mutate(vars, { onSuccess, onError })`).
5. **`columns.tsx` is presentation.** Any cell with its own state or mutation lives in its own component
   file (e.g. `settings/setting-value-cell.tsx`) and is just referenced from the column.
6. **Cross-feature access goes through the other feature's `api.ts`** (e.g. the tenant screen uses
   `usePlans()`), never its screens or internals.

## Request & auth flow

```
Screen ──useXxx()──▶ features/platform/x/api.ts ──▶ lib/api/client (axios)
                                               │  request:  Authorization: Bearer <getAccessToken()>
                                               │  401:      refreshAccessToken() once, retry
                                               ▼
                                    features/platform/auth/session.ts  (handlers registered at startup)
                                               │
                                    features/platform/auth/store.ts (zustand, persisted)
```

- `setupApiAuth()` (called once in `app/providers.tsx`) registers how to read the token, how to refresh,
  and which URLs must never trigger a refresh (`/auth/login`, `/auth/refresh`).
- Concurrent 401s share a single in-flight refresh promise.
- The refresh call goes through bare axios (not `api`), so it never loops through the interceptor.
- If the refresh fails, the session is cleared. **`AuthGuard`** (`(app)/layout.tsx`) sees the token disappear and
  `router.replace("/login")`s. The login screen redirects to `/dashboard` once a token exists.
- `useLogin` clears the Query cache before storing a new session, so one admin's data never shows to the next.
- `useAuthHydrated()` (`useSyncExternalStore` on zustand-persist) stops the guard from redirecting before
  localStorage has been read.

> The auth gate is client-side only and tokens live in localStorage. The API must enforce authorization.
> Moving to httpOnly cookies + `proxy`/middleware gating would be the next hardening step.

## Errors

The API returns RFC 7807 `ProblemDetails` with a `code`. `applyProblem(error, setError?)` maps them:

| `code` | Behaviour |
| --- | --- |
| `validation_failed` | field errors pushed into react-hook-form (PascalCase → camelCase) |
| `plan_limit_reached` | warning toast |
| `concurrency_conflict` | "changed by someone else" toast (entities carry `rowVersion`) |
| other / no body | error toast with `traceId`, or "Network error" |

## Tables & lists

- `components/data-table.tsx` is always *controlled* (`manualSorting`): the caller supplies the page of
  rows, `total`, `page`, and `sorting`.
- **Server-paged lists** (tenants, logs) send `page/pageSize/search/sortBy/desc` to the API.
- **Full-list endpoints** (admins, plans, settings, dashboard signups) use `hooks/use-local-table.ts`.
  You give it a module-level `SortAccessors` map (column id → sort value), and the result spreads
  straight into `<DataTable {...table} />`.
- Logs: only the active tab's query is `enabled`.

## Conventions

- Query keys are `[feature, …]` (e.g. `["tenants", "list", query]`, `["tenants", id, "subs"]`). Mutations
  invalidate the feature root key.
- Dates come from the API as UTC strings. Show them with `fmtDate()` (default zone `Asia/Dhaka`).
- Numeric enums from the API live in `lib/enums.ts` together with their labels and badge variants.
- Forms: a zod schema plus `zodResolver`. Use `z.input`/`z.output` generics when the schema transforms values.
- Detail screens serve both create and edit (`PlanPage`, `TenantPage`): `id` absent means create.

## Adding a feature

1. `src/features/platform/<name>/api.ts`: types, query/mutation hooks, invalidation. No toasts.
2. `columns.tsx` if it has a table. `<name>-page.tsx` (`"use client"`) for the screen.
3. `src/app/(app)/<name>/page.tsx`: `export default function Page() { return <NamePage />; }`
4. Add a nav entry in `components/app-sidebar.tsx`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the SellerHub API (trailing slashes are stripped) |

Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
