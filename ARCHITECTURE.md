# SellerHub Web — Architecture

Front ends for SellerHub. They talk to the separate REST API (`NEXT_PUBLIC_API_URL`, the `SellerHub` repo).
It is an npm-workspaces monorepo with **two Next.js apps** that share UI and HTTP code through packages.

| App | Who uses it | API surface | Dev port |
| --- | --- | --- | --- |
| `apps/platform` (`@sellerhub/platform`) | SellerHub staff: shops, plans, settings, logs, admins | `/api/platform/*` | 3000 |
| `apps/tenant` (`@sellerhub/tenant`) | Shop owners and staff: sign-up, sign-in, the shop itself | `/api/auth`, tenant endpoints | 3001 |

### Why two apps

- **Separate origins = separate token storage.** Both apps keep tokens in `localStorage`, and anything stored
  there can be read by script on the same origin. When each app is deployed on its own origin (e.g. `admin.` and `app.`), an XSS bug in the
  larger, tenant-facing app can never read a platform admin token.
- The API already treats them as different principals: platform tokens carry `principal=platform` and no
  `tenant_id`; tenant tokens must carry `tenant_id`. Each app holds exactly one kind of session.
- Different audiences, release cadence and bundle needs (internal console vs public product).

## Stack

| Concern | Library |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Server state | TanStack Query 5 |
| Client state | Zustand 5 (`persist` → localStorage / sessionStorage) |
| HTTP | Axios |
| Forms / validation | react-hook-form + zod |
| Tables | TanStack Table 9 |
| UI | shadcn-style components on Base UI, Tailwind CSS 4, lucide icons, sonner toasts |
| Charts / dates | Recharts (platform), dayjs (utc + timezone) |

## Repository layout

```
sellerhub-web/
├── package.json              workspaces + root scripts; shared devDependencies (TS, ESLint, Tailwind)
├── apps/
│   ├── platform/             admin console
│   └── tenant/               shop app
└── packages/
    ├── ui/                   @sellerhub/ui — design system + generic UI helpers
    │   └── src/
    │       ├── components/   primitives (button, card, dialog, sidebar…) — no app knowledge
    │       ├── data-table.tsx, time-zone-select.tsx
    │       ├── hooks/        use-local-table, use-mobile
    │       ├── lib/          utils (cn), table (TanStack features), dayjs (fmtDate, display zone)
    │       └── styles/globals.css   Tailwind entry + theme tokens (imported by each app)
    ├── api-client/           @sellerhub/api-client — axios instance, auth interceptors, ProblemDetails
    │   └── src/client.ts, errors.ts, types.ts
    └── config/               @sellerhub/config — tsconfig.base.json
```

Packages ship TypeScript source (no build step); Next compiles workspace packages itself. Import them by
subpath, as listed in each package's `exports`:

```ts
import { Button } from "@sellerhub/ui/components/button";
import { DataTable } from "@sellerhub/ui/data-table";
import { fmtDate } from "@sellerhub/ui/lib/dayjs";
import { api, configureApiAuth } from "@sellerhub/api-client/client";
import { applyProblem } from "@sellerhub/api-client/errors";
```

`@/*` inside an app still means that app's own `src/`.

### Inside an app

```
apps/<app>/src/
├── app/                      ROUTING LAYER — URLs, layouts, providers only
│   ├── layout.tsx            <html>, globals.css, <Providers>
│   ├── providers.tsx         QueryClient, Tooltip, Toaster; calls setupApiAuth()
│   ├── (auth)/…              sign-in (and, in tenant, register)
│   └── (app)/                authenticated area: layout.tsx = <AuthGuard> + sidebar shell
├── features/<name>/          FEATURE LAYER — one folder per business area
│   ├── api.ts                types + raw requests + TanStack Query hooks (no UI)
│   ├── columns.tsx           table column definitions (presentation only)
│   ├── *-page.tsx            screens ("use client"): forms, tables, dialogs, toasts
│   └── *.tsx                 feature-private components
├── components/app-sidebar.tsx    the app shell navigation
└── lib/                      app-specific helpers (platform: enums.ts)
```

The platform app keeps its features under `features/platform/<name>/` and its URLs under `/platform/…`
(historical; both could drop the prefix now that it is its own app). The tenant app uses `features/<name>/`.

## Layer rules

Dependencies point **downwards only**:

```
app (routes)  →  features  →  @sellerhub/ui  →  (nothing app-specific)
                    │
                    └────────→  @sellerhub/api-client
```

1. **Packages import nothing from an app.** No stores, features, routes or `@/` imports. The API client
   knows no endpoints and no store; auth behaviour is injected through `configureApiAuth()`.
2. **`@sellerhub/ui` knows nothing about the domain.** The only app files in `components/` are the shell
   (`app-sidebar.tsx` → `useSignOut`).
3. **Apps never import each other.** Code needed by both goes into a package.
4. **`app/**/page.tsx` holds no logic.** It reads route params and renders one feature screen. Pages are
   server components; the screen they render is the `"use client"` boundary.
5. **`features/*/api.ts` is the data layer.** It owns DTO types, endpoints, query keys and cache
   invalidation. It must not show toasts, navigate, or touch forms. Success/error feedback is the
   screen's job (`mutate(vars, { onSuccess, onError })`).
6. **`columns.tsx` is presentation.** Any cell with its own state or mutation lives in its own component
   file (e.g. `settings/setting-value-cell.tsx`) and is just referenced from the column.
7. **Cross-feature access goes through the other feature's `api.ts`** (e.g. the tenant screen uses
   `usePlans()`), never its screens or internals.

## Request & auth flow

Both apps use the same mechanism; only the store and endpoints differ.

```
Screen ──useXxx()──▶ features/…/api.ts ──▶ @sellerhub/api-client (axios)
                                         │  request:  Authorization: Bearer <getAccessToken()>
                                         │  401:      refreshAccessToken() once, retry
                                         ▼
                              features/…/auth/session.ts  (handlers registered at startup)
                                         │
                              features/…/auth/store.ts (zustand, persisted)
```

- `setupApiAuth()` (called once in `app/providers.tsx`) registers how to read the token, how to refresh,
  and which URLs must never trigger a refresh (login / register / refresh).
- Concurrent 401s share a single in-flight refresh promise.
- The refresh call goes through bare axios (not `api`), so it never loops through the interceptor.
- If the refresh fails, the session is cleared and **`AuthGuard`** (`(app)/layout.tsx`) `router.replace`s to
  `/login`. The login screen redirects into the app once a token exists.
- Signing in clears the Query cache first, so one user's data never shows to the next.
- `useAuthHydrated()` (`useSyncExternalStore` on zustand-persist) stops the guard from redirecting before
  storage has been read.

| | Platform | Tenant |
| --- | --- | --- |
| Endpoints | `/api/platform/auth/*` | `/api/auth/*` (`login` takes an email **or** phone as `identifier`; `register` creates a shop + owner) |
| Store key | `sellerhub-platform-auth` (localStorage) | `sellerhub-tenant-auth` (localStorage) + `sellerhub-tenant-impersonation` (sessionStorage) |
| Extra | Display zone from the `PlatformTimeZone` setting | `mustChangePassword` users are held on `/change-password`. A password change revokes every session on the API, so the app signs back in with the new password. |

### Impersonation ("Impersonate" on a shop in the platform app)

```
platform  POST /api/platform/tenants/{id}/impersonate  →  { accessToken, expiresInSeconds, userName }
          window.open(TENANT_APP_URL/impersonate#token=…&expiresIn=…&name=…, noopener)
tenant    /impersonate reads the fragment → sessionStorage → wipes it from the URL → /dashboard
```

- The token travels in the URL **fragment**, which browsers never send to a server (no access logs and no `Referer`).
- It lives in that one tab's **sessionStorage**, so it never replaces the shop user's own session in other tabs.
- A banner is shown on every screen. Impersonation tokens have no refresh token: on expiry (401), or when
  the admin clicks "End impersonation", the tab shows "Impersonation ended" instead of the login page.
- If `NEXT_PUBLIC_TENANT_APP_URL` is unset, the platform app falls back to copying the token to the clipboard.

> Auth gates are client-side only, and tokens live in web storage. The API must enforce authorization.
> The next hardening step: move to httpOnly cookies on each app's own domain, gate routes in `proxy`, and
> give platform and tenant tokens distinct JWT audiences.

## Errors

The API returns RFC 7807 `ProblemDetails` with a `code`. `applyProblem(error, setError?)` maps them:

| `code` | Behaviour |
| --- | --- |
| `validation_failed` | field errors pushed into react-hook-form (PascalCase → camelCase) |
| `plan_limit_reached` | warning toast |
| `concurrency_conflict` | "changed by someone else" toast (entities carry `rowVersion`) |
| other / no body | error toast with `traceId`, or "Network error" |

## Tables & lists

- `@sellerhub/ui/data-table` is always *controlled* (`manualSorting`): the caller supplies the page of
  rows, `total`, `page`, and `sorting`.
- **Server-paged lists** (tenants, logs) send `page/pageSize/search/sortBy/desc` to the API.
- **Full-list endpoints** (admins, plans, settings, dashboard signups) use `@sellerhub/ui/hooks/use-local-table`.
  You give it a module-level `SortAccessors` map (column id → sort value), and the result spreads
  straight into `<DataTable {...table} />`.
- Logs: only the active tab's query is `enabled`.

## Conventions

- Query keys are `[feature, …]` (e.g. `["tenants", "list", query]`, `["tenants", id, "subs"]`). Mutations
  invalidate the feature root key.
- Dates come from the API as UTC strings. Show them with `fmtDate()` (default zone: the browser's, or the
  platform's `PlatformTimeZone` in the platform app).
- Numeric enums from the API live in the platform app's `lib/enums.ts` together with their labels and badge variants.
- Forms: a zod schema plus `zodResolver`. Use `z.input`/`z.output` generics when the schema transforms values.
- Detail screens serve both create and edit (`PlanPage`, `TenantPage`): `id` absent means create.

## Adding things

**A feature** (in either app):
1. `src/features/<…>/<name>/api.ts`: types, query/mutation hooks, invalidation. No toasts.
2. `columns.tsx` if it has a table. `<name>-page.tsx` (`"use client"`) for the screen.
3. `src/app/(app)/<route>/page.tsx`: `export default function Page() { return <NamePage />; }`
4. Add a nav entry in that app's `components/app-sidebar.tsx`.

**A shadcn component**: run the CLI from `packages/ui` (`npx shadcn add <name>`). Its `components.json`
writes into `packages/ui/src/components`.

**A dependency**: `npm install <pkg> -w @sellerhub/tenant` (or `-w @sellerhub/ui`, …) from the repo root.

## Environment

Each app has its own `.env.local` (git-ignored).

| Variable | App | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | both | Base URL of the SellerHub API (trailing slashes are stripped) |
| `NEXT_PUBLIC_TENANT_APP_URL` | platform | Origin of the tenant app, used by "Impersonate" (e.g. `http://localhost:3001`) |

The API must list both origins in `Cors:AllowedOrigins`.

## Scripts (repo root)

| Script | Does |
| --- | --- |
| `npm run dev:platform` / `npm run dev:tenant` | dev server on :3000 / :3001 |
| `npm run build` (or `build:platform`, `build:tenant`) | production build |
| `npm run lint` | ESLint in both apps |
| `npm run typecheck` | `tsc --noEmit` in every workspace |
