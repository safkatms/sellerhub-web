import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlatformAdmin, PlatformAuthResult } from "@/lib/api/types";

type AuthState = {
    accessToken: string | null;
    refreshToken: string | null;
    admin: PlatformAdmin | null;
    setSession: (r: PlatformAuthResult) => void;
    setAdmin: (a: PlatformAdmin) => void;
    clear: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            admin: null,
            setSession: (r) => set({ accessToken: r.accessToken, refreshToken: r.refreshToken, admin: r.admin }),
            setAdmin: (admin) => set({ admin }),
            clear: () => set({ accessToken: null, refreshToken: null, admin: null }),
        }),
        { name: "sellerhub-platform-auth" }
    )
);