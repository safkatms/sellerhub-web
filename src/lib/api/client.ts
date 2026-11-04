import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import type { PlatformAuthResult } from "./types";

const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
export const api = axios.create({ baseURL });

api.interceptors.request.use((cfg) => {
    const t = useAuthStore.getState().accessToken;
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
});

let refreshing: Promise<string | null> | null = null;

async function refresh(): Promise<string | null> {
    const { refreshToken, setSession, clear } = useAuthStore.getState();
    if (!refreshToken) return null;
    try {
        const { data } = await axios.post<PlatformAuthResult>(`${baseURL}/api/platform/auth/refresh`, { refreshToken });
        setSession(data);
        return data.accessToken;
    } catch {
        clear();
        return null;
    }
}

api.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
        const cfg = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const skip = /\/auth\/(login|refresh)$/.test(cfg?.url ?? "");
        if (error.response?.status === 401 && cfg && !cfg._retry && !skip) {
            cfg._retry = true;
            refreshing ??= refresh().finally(() => (refreshing = null));
            const token = await refreshing;
            if (token) {
                cfg.headers.Authorization = `Bearer ${token}`;
                return api(cfg);
            }
            if (typeof window !== "undefined") window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);