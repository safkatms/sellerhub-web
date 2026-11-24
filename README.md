# SellerHub Web

Front ends for SellerHub, as an npm-workspaces monorepo:

- `apps/platform`: the admin console for SellerHub staff (http://localhost:3000)
- `apps/tenant`: the shop app for shop owners and staff (http://localhost:3001)
- `packages/ui`, `packages/api-client`, `packages/config`: code the two apps share

See [FRONTEND_ARCHITECTURE.md](../../SellerHub/docs/FRONTEND_ARCHITECTURE.md) (in the backend repo's `docs/`) for layout, layer rules and the auth/impersonation flows.

## Getting started

```bash
npm install            # once, from the repo root

npm run dev:platform   # http://localhost:3000
npm run dev:tenant     # http://localhost:3001
```

Create `.env.local` in each app:

```bash
# apps/platform/.env.local
NEXT_PUBLIC_API_URL=https://localhost:44375/
NEXT_PUBLIC_TENANT_APP_URL=http://localhost:3001

# apps/tenant/.env.local
NEXT_PUBLIC_API_URL=https://localhost:44375/
```

The API must allow both origins in `Cors:AllowedOrigins`.

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.
