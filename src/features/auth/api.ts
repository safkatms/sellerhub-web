import { api } from "@/lib/api/client";
import type { PlatformAdmin, PlatformAuthResult } from "@/lib/api/types";

export const login = (body: { email: string; password: string }) =>
    api.post<PlatformAuthResult>("/api/platform/auth/login", body).then((r) => r.data);

export const logout = (refreshToken: string) =>
    api.post("/api/platform/auth/logout", { refreshToken });

export const me = () => api.get<PlatformAdmin>("/api/platform/auth/me").then((r) => r.data);

export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
    api.post("/api/platform/auth/change-password", body);