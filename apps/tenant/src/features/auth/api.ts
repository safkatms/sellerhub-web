import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBaseURL } from "@sellerhub/api-client/client";
import { useAuthStore, useImpersonationStore } from "./store";
import type { RegisterBody, TenantAuthResult, TenantUser } from "./types";

const base = "/api/auth";

export const login = (body: { identifier: string; password: string }) =>
    api.post<TenantAuthResult>(`${base}/login`, body).then((r) => r.data);

export const register = (body: RegisterBody) =>
    api.post<TenantAuthResult>(`${base}/register`, body).then((r) => r.data);

/** Uses a bare axios call so the refresh request never goes through the 401 interceptor. */
export const refresh = (refreshToken: string) =>
    axios.post<TenantAuthResult>(`${apiBaseURL}${base}/refresh`, { refreshToken }).then((r) => r.data);

export const logout = (refreshToken: string) => api.post(`${base}/logout`, { refreshToken });

export const me = () => api.get<TenantUser>(`${base}/me`).then((r) => r.data);

export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
    api.post(`${base}/change-password`, body);

export const meKey = ["auth", "me"] as const;
export const useMe = () => useQuery({ queryKey: meKey, queryFn: me });

/** Starts a fresh own session: drops cached data and any impersonation left in this tab. */
const useStartSession = () => {
    const qc = useQueryClient();
    return (session: TenantAuthResult) => {
        qc.clear();
        useImpersonationStore.getState().reset();
        useAuthStore.getState().setSession(session);
    };
};

export const useLogin = () => {
    const start = useStartSession();
    return useMutation({ mutationFn: login, onSuccess: start });
};

export const useRegister = () => {
    const start = useStartSession();
    return useMutation({ mutationFn: register, onSuccess: start });
};

/**
 * The API revokes every session of the user when the password changes, so we sign straight back in
 * with the new password to get a working refresh token.
 */
export const useChangePassword = () => {
    const start = useStartSession();
    return useMutation({
        mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
            const user = useAuthStore.getState().user;
            await changePassword(body);
            const identifier = user?.email ?? user?.phone;
            try {
                if (!identifier) throw new Error("Signed-in user has no email or phone.");
                return await login({ identifier, password: body.newPassword });
            } catch (e) {
                // The old session is already revoked server-side; send the user to sign in with the new password.
                useAuthStore.getState().clear();
                throw e;
            }
        },
        onSuccess: start,
    });
};

/** Ends the session this tab uses. AuthGuard handles what is shown next. */
export const useSignOut = () => {
    const qc = useQueryClient();
    return async () => {
        const imp = useImpersonationStore.getState();
        if (imp.accessToken) {
            imp.end(); // impersonation tokens have no refresh token to revoke
        } else {
            const { refreshToken, clear } = useAuthStore.getState();
            try {
                if (refreshToken) await logout(refreshToken);
            } catch {
                // Server-side revoke failing must not block a local sign-out.
            }
            clear();
        }
        qc.clear();
    };
};
