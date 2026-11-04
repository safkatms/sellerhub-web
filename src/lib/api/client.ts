import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Generic HTTP client. This module is infrastructure: it knows nothing about
 * stores, features, routes or auth endpoints. The auth feature plugs its
 * behaviour in through `configureApiAuth` (see `features/auth/session.ts`).
 */
export const apiBaseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
export const api = axios.create({ baseURL: apiBaseURL });

export type ApiAuthHandlers = {
    /** Current bearer token, or null when signed out. */
    getAccessToken: () => string | null;
    /** Obtain a fresh access token; resolve null when the session cannot be renewed. */
    refreshAccessToken: () => Promise<string | null>;
    /** Requests whose 401 must not trigger a refresh (e.g. login itself). */
    skipRefresh?: (url: string) => boolean;
};

let auth: ApiAuthHandlers | null = null;

export function configureApiAuth(handlers: ApiAuthHandlers) {
    auth = handlers;
}

api.interceptors.request.use((cfg) => {
    const t = auth?.getAccessToken();
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
        const cfg = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const skip = auth?.skipRefresh?.(cfg?.url ?? "") ?? false;
        if (auth && error.response?.status === 401 && cfg && !cfg._retry && !skip) {
            cfg._retry = true;
            refreshing ??= auth.refreshAccessToken().finally(() => (refreshing = null));
            const token = await refreshing;
            if (token) {
                cfg.headers.Authorization = `Bearer ${token}`;
                return api(cfg);
            }
        }
        return Promise.reject(error);
    }
);
