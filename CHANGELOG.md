# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — 2026-11-05

Layering refactor. No API contract or visible behaviour changes except where noted under **Fixed**.
See [ARCHITECTURE.md](ARCHITECTURE.md) for the resulting rules.

### Changed
- **API client is pure infrastructure.** `lib/api/client.ts` no longer imports the auth store, hardcodes the
  refresh endpoint, or redirects via `window.location`. Auth plugs in through the new `configureApiAuth()`,
  wired by `features/auth/session.ts` → `setupApiAuth()` (called from `app/providers.tsx`).
- **Auth consolidated into `features/auth/`.**
  - `stores/auth-store.ts` → `features/auth/store.ts` (the `stores/` folder is removed; the localStorage key is unchanged).
  - `PlatformAdmin` / `PlatformAuthResult` moved from `lib/api/types.ts` to `features/auth/types.ts`.
  - New `useLogin`, `useSignOut`, `refresh` in `features/auth/api.ts`, and `useAuthHydrated` in the store.
  - New `AuthGuard` component. `(app)/layout.tsx` is now a server component that wraps it.
- **Routes are thin.** All screen code moved out of `app/` into features:
  `admins/admins-page.tsx`, `dashboard/dashboard-page.tsx`, `logs/logs-page.tsx`,
  `plans/plans-list-page.tsx`, `settings/settings-page.tsx`, `tenants/tenants-list-page.tsx`,
  `auth/login-page.tsx`. Every `page.tsx` is now a server component. `[id]` pages `await params`
  instead of `"use client"` + `use(params)`.
- **No UI side-effects in the data layer.** The `toast.success` calls in `plans`, `settings` and `tenants` API hooks were
  moved to the screens that trigger the mutations.
- **Shared local sorting/paging.** Four copy-pasted sort + slice blocks (admins, plans, settings, dashboard)
  were replaced by `hooks/use-local-table.ts`.
- **Column files are presentation-only.** The settings inline editor moved to `settings/setting-value-cell.tsx`.
  `RecentSignup` (and the new `ExpiringTenant`) types now live in `dashboard/api.ts`, not `columns.tsx`.
- **Logs.** The three detail dialogs were extracted to `logs/log-details.tsx` (shared `LogDialog`/`Field`/`Block`).
  The error dialog fetches its own details.
- `components/app-sidebar.tsx` signs out via `useSignOut()` instead of calling the store and API directly.

### Fixed
- Logs page fired all three log queries (audit, logins, errors) on every render. Only the active tab is
  fetched now.
- Signing in after another admin's session could briefly show that admin's cached data. The Query cache is
  now cleared on login.
- A failed token refresh with no refresh token left a stale access token in the store. The session is now cleared.
- Tenants list: changing sort now resets to page 1 (as every other list already did).
- Audit/login/error dialogs showed raw UTC timestamps. They now use `fmtDate`.
- Lint: removed setState-in-effect in the auth hydration check and `useIsMobile` (both now use
  `useSyncExternalStore`). Replaced `watch()` with `useWatch` in the tenant form. Removed the unused `DialogClose`
  import and the `window.location.href` navigations. `eslint` went from 2 errors + 4 warnings to clean.

### Added (platform time zone)
- Login/refresh now return `timeZone` (the `PlatformTimeZone` setting, default `Asia/Dhaka`). It is stored in the auth session and applied to `fmtDate`
  (`lib/dayjs.ts` `setDisplayZone`) by `setupApiAuth()`, so dates are correct on the first render after a reload.
- Saving `PlatformTimeZone` in Settings updates the session zone immediately; `DisplayZoneProvider` (`features/auth/display-zone.tsx`) re-renders visible dates.
- Backend: `PlatformTimeZone` setting is validated as an IANA id and used for the dashboard "New this month" boundary.

### Added
- `ARCHITECTURE.md`: layers, dependency rules, auth/request flow, conventions.
- `CHANGELOG.md`.

## [0.1.0] — 3e3c84f

- Initial platform console: login, dashboard, shops (tenants) with subscriptions and actions, plans,
  settings, logs, platform admins.
