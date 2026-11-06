import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { TenantAuthResult, TenantUser } from "./types";

/** The shop user's own session. Persisted in localStorage, so it survives reloads and new tabs. */
type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    user: TenantUser | null;
    /** The shop's IANA zone for displaying dates; comes from the server at login/refresh. */
    timeZone: string | null;
    setSession: (r: TenantAuthResult) => void;
    setUser: (u: TenantUser) => void;
    clear: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            timeZone: null,
            setSession: (r) =>
                set({ accessToken: r.accessToken, refreshToken: r.refreshToken, user: r.user, timeZone: r.timeZone }),
            setUser: (user) => set({ user }),
            clear: () => set({ accessToken: null, refreshToken: null, user: null, timeZone: null }),
        }),
        { name: "sellerhub-tenant-auth" }
    )
);

/**
 * A platform admin acting as a shop user ("Impersonate" in the platform app).
 * Lives in sessionStorage: scoped to the one tab it was opened in, and never overwrites a real session.
 * The token has no refresh token; when it expires the tab is `ended` instead of falling back to /login.
 */
type ImpersonationState = {
    accessToken: string | null;
    userName: string | null;
    expiresAtUtc: string | null;
    /** The impersonated shop's IANA zone. */
    timeZone: string | null;
    /** The tab was an impersonation tab and the session is over (expired or ended by the admin). */
    ended: boolean;
    start: (s: { accessToken: string; userName: string | null; expiresAtUtc: string | null; timeZone: string | null }) => void;
    end: () => void;
    reset: () => void;
};

const noImpersonation = { accessToken: null, userName: null, expiresAtUtc: null, timeZone: null, ended: false };

export const useImpersonationStore = create<ImpersonationState>()(
    persist(
        (set) => ({
            ...noImpersonation,
            start: (s) => set({ ...s, ended: false }),
            end: () => set({ ...noImpersonation, ended: true }),
            reset: () => set(noImpersonation),
        }),
        { name: "sellerhub-tenant-impersonation", storage: createJSONStorage(() => sessionStorage) }
    )
);

/** True when this tab belongs to an impersonation (active or ended). */
const isImpersonationTab = (s: ImpersonationState) => s.accessToken !== null || s.ended;

/** Token to send with API calls: the impersonation token in an impersonation tab, otherwise the user's own. */
export const getAccessToken = () => {
    const imp = useImpersonationStore.getState();
    return isImpersonationTab(imp) ? imp.accessToken : useAuthStore.getState().accessToken;
};

/** Display zone of the session this tab uses (null = browser zone). */
export const getSessionTimeZone = () => {
    const imp = useImpersonationStore.getState();
    return isImpersonationTab(imp) ? imp.timeZone : useAuthStore.getState().timeZone;
};

/** Reactive view of the session this tab is using. */
export function useActiveSession() {
    const imp = useImpersonationStore();
    const auth = useAuthStore();
    const impersonating = isImpersonationTab(imp);
    return {
        impersonating,
        ended: imp.ended,
        token: impersonating ? imp.accessToken : auth.accessToken,
        /** Only known for the user's own session; screens that need it under impersonation use `useMe()`. */
        user: impersonating ? null : auth.user,
    };
}

const useHydrated = (store: typeof useAuthStore | typeof useImpersonationStore) =>
    useSyncExternalStore(
        (onChange) => store.persist.onFinishHydration(onChange),
        () => store.persist.hasHydrated(),
        () => false,
    );

/** True once both persisted sessions have been read from storage (always false on the server). */
export const useAuthHydrated = () => {
    const auth = useHydrated(useAuthStore);
    const imp = useHydrated(useImpersonationStore);
    return auth && imp;
};
