export type PlatformAdmin = { id: string; fullName: string; email: string; lastLoginAtUtc: string | null };

export type PlatformAuthResult = {
    admin: PlatformAdmin; accessToken: string; accessTokenExpiresInSeconds: number;
    refreshToken: string; refreshTokenExpiresAtUtc: string;
    /** IANA zone (PlatformTimeZone setting) used to display dates. */
    timeZone: string;
};
