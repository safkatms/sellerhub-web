import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlatformAdmin, PlatformAuthResult } from "./types";

type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    admin: PlatformAdmin | null;
    /** IANA zone for displaying dates; comes from the server at login/refresh. */
    timeZone: string | null;
    setSession: (r: PlatformAuthResult) => void;
    setAdmin: (a: PlatformAdmin) => void;
    setTimeZone: (zone: string) => void;
    clear: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            admin: null,
            timeZone: null,
            setSession: (r) => set({ accessToken: r.accessToken, refreshToken: r.refreshToken, admin: r.admin, timeZone: r.timeZone }),
            setAdmin: (admin) => set({ admin }),
            setTimeZone: (timeZone) => set({ timeZone }),
            clear: () => set({ accessToken: null, refreshToken: null, admin: null, timeZone: null }),
        }),
        { name: "sellerhub-platform-auth" }
    )
);

/** True once the persisted session has been read from localStorage (always false on the server). */
export const useAuthHydrated = () =>
    useSyncExternalStore(
        (onChange) => useAuthStore.persist.onFinishHydration(onChange),
        () => useAuthStore.persist.hasHydrated(),
        () => false,
    );
