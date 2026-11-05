import { configureApiAuth } from "@/lib/api/client";
import { setDisplayZone } from "@/lib/dayjs";
import { refresh } from "./api";
import { useAuthStore } from "./store";

/**
 * Wires the auth session into the generic API client. Called once from
 * `app/providers.tsx`. On a failed refresh the session is cleared; AuthGuard
 * then sends the user to /login.
 */
export function setupApiAuth() {
    // Dates render in the zone the server sent at login. Apply it now (persisted value) and on every change.
    const apply = () => setDisplayZone(useAuthStore.getState().timeZone);
    apply();
    useAuthStore.subscribe(apply);

    configureApiAuth({
        getAccessToken: () => useAuthStore.getState().accessToken,
        skipRefresh: (url) => /\/auth\/(login|refresh)$/.test(url),
        refreshAccessToken: async () => {
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
