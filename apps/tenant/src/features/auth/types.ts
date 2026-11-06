export type TenantUser = {
    id: string; tenantId: string; fullName: string; email: string | null; phone: string | null;
    isOwner: boolean; mustChangePassword: boolean; lastLoginAtUtc: string | null;
};

export type TenantAuthResult = {
    user: TenantUser; accessToken: string; accessTokenExpiresInSeconds: number;
    refreshToken: string; refreshTokenExpiresAtUtc: string;
    /** The shop's IANA zone (Tenant.TimeZone), used to display dates. */
    timeZone: string;
};

export type RegisterBody = { shopName: string; ownerName: string; email?: string; phone?: string; password: string };
