export const TenantStatus = { Active: 1, Suspended: 2, Closed: 3 } as const;
export const PlanState = { Active: 0, Grace: 1, Expired: 2, Suspended: 3, Closed: 4 } as const;
export const SubscriptionSource = { Trial: 1, Manual: 2, Online: 3 } as const;
export const PlatformAdminStatus = { Active: 1, Disabled: 2 } as const;
export const TenantTimeZone = { Bangladesh: "Asia/Dhaka" } as const;
export const TenantLanguage = { English: "en", Bangla: "bn" } as const;
export const TenantCurrency = { Bangladesh: "BDT" } as const;

export const planStateLabel = ["Active", "Grace", "Expired", "Suspended", "Closed"];
export const tenantStatusLabel: Record<number, string> = { 1: "Active", 2: "Suspended", 3: "Closed" };
export const sourceLabel: Record<number, string> = { 1: "Trial", 2: "Manual", 3: "Online" };
export const planStateVariant = ["default", "secondary", "destructive", "outline", "outline"] as const;