import type { ImpersonationResult } from "./api";

const tenantAppURL = process.env.NEXT_PUBLIC_TENANT_APP_URL?.replace(/\/+$/, "");

/**
 * Opens the shop app as the impersonated user in a new tab. The token goes in the URL fragment, which is never
 * sent to a server or written to access logs; the shop app's /impersonate page moves it into that tab's
 * sessionStorage and wipes the fragment. Returns false when the shop app URL is not configured.
 */
export function openTenantApp(r: ImpersonationResult): boolean {
  if (!tenantAppURL) return false;
  const fragment = new URLSearchParams({
    token: r.accessToken,
    expiresIn: String(r.expiresInSeconds),
    name: r.userName,
  });
  window.open(`${tenantAppURL}/impersonate#${fragment}`, "_blank", "noopener,noreferrer");
  return true;
}
