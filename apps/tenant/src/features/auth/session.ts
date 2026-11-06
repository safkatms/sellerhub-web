import { configureApiAuth } from "@sellerhub/api-client/client";
import { refresh } from "./api";
import { getAccessToken, useAuthStore, useImpersonationStore } from "./store";

/**
 * Wires the auth session into the generic API client. Called once from `app/providers.tsx`.
 * On a failed refresh the session is cleared; AuthGuard then sends the user to /login
 * (or shows "impersonation ended" in an impersonation tab).
 */
export function setupApiAuth() {
    configureApiAuth({
        getAccessToken,
        skipRefresh: (url) => /\/auth\/(login|register|refresh)$/.test(url),
        refreshAccessToken: async () => {
            const imp = useImpersonationStore.getState();
            if (imp.accessToken) {
                // Impersonation tokens cannot be renewed; the admin starts a new one from the platform app.
                imp.end();
                return null;
            }
            const { refreshToken, setSession, clear } = useAuthStore.getState();
            if (!refreshToken) {
                clear();
                return null;
            }
            try {
                const session = await refresh(refreshToken);
                setSession(session);
                return session.accessToken;
            } catch {
                clear();
                return null;
            }
        },
    });
}
