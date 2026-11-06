import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiBaseURL } from "@sellerhub/api-client/client";
import { useAuthStore } from "./store";
import type { PlatformAdmin, PlatformAuthResult } from "./types";

const base = "/api/platform/auth";

export const login = (body: { email: string; password: string }) =>
    api.post<PlatformAuthResult>(`${base}/login`, body).then((r) => r.data);

/** Uses a bare axios call so the refresh request never goes through the 401 interceptor. */
export const refresh = (refreshToken: string) =>
    axios.post<PlatformAuthResult>(`${apiBaseURL}${base}/refresh`, { refreshToken }).then((r) => r.data);

export const logout = (refreshToken: string) => api.post(`${base}/logout`, { refreshToken });

export const me = () => api.get<PlatformAdmin>(`${base}/me`).then((r) => r.data);

export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
    api.post(`${base}/change-password`, body);

export const useLogin = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: login,
        onSuccess: (session) => {
            // Never let a previous admin's cached data leak into the new session.
            qc.clear();
            useAuthStore.getState().setSession(session);
        },
    });
};

/** Revokes the refresh token (best effort) and clears the local session. AuthGuard handles the redirect. */
export const useSignOut = () => async () => {
    const { refreshToken, clear } = useAuthStore.getState();
    try {
        if (refreshToken) await logout(refreshToken);
    } catch {
        // Server-side revoke failing must not block a local sign-out.
    }
    clear();
};
