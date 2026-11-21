// ---------------------------------------------------------------- two-factor

import { api } from "@sellerhub/api-client/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";

const twoFa = "/api/platform/auth/2fa";
const myKey = ["access", "me"] as const;
export const useTwoFactor = () => {
    const qc = useQueryClient();
    const ok = () => qc.invalidateQueries({ queryKey: myKey });
    return {
        setup: useMutation({ mutationFn: () => api.post<{ secret: string; otpAuthUri: string }>(`${twoFa}/setup`).then((r) => r.data) }),
        enable: useMutation({ mutationFn: (code: string) => api.post(`${twoFa}/enable`, { code }), onSuccess: ok }),
        disable: useMutation({ mutationFn: (code: string) => api.post(`${twoFa}/disable`, { code }), onSuccess: ok }),
        reset: useMutation({
            mutationFn: (adminId: string) => api.post(`${twoFa}/reset/${adminId}`),
            onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
        }),
    };
};
