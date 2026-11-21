/** Friendly names for known setting keys. Unknown keys fall back to a humanized version of the key. */
const labels: Record<string, string> = {
  PlatformTimeZone: "Platform time zone",
  PlanGraceDays: "Plan grace period (days)",
  FallbackPlanCode: "Fallback plan",
  PlanReminderDays: "Expiry reminder days",
  TrialDays: "Trial length (days)",
  TrialPlanCode: "Trial plan",
  PaymentInstructions: "Payment instructions (shown to shops)",
  InvoiceDueDays: "Invoice due after (days)",
  NotificationMaxAttempts: "Message send attempts",
  SmsCostPerMessage: "SMS cost per message (BDT)",
  MaintenanceMode: "Maintenance mode (true/false)",
  MaintenanceMessage: "Maintenance message",
  SignupEnabled: "Shop sign-up open (true/false)",
  MaxSignupsPerIpPerDay: "Sign-ups per IP per day (0 = no limit)",
  AdminIpAllowlist: "Console IP allowlist (empty = any IP)",
  DataRetentionDaysAfterClose: "Keep data after deletion approval (days)",
};

/** "SomeNewSetting" -> "Some new setting" */
const humanize = (key: string) => {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const settingLabel = (key: string) => labels[key] ?? humanize(key);

export type SettingKind =
  | { type: "text" }
  | { type: "textarea"; placeholder?: string }
  | { type: "bool" }
  | { type: "int"; min?: number; max?: number }
  | { type: "decimal"; min?: number }
  | { type: "plan" }
  | { type: "timezone" }
  | { type: "days-list" };

const kinds: Record<string, SettingKind> = {
  PlatformTimeZone: { type: "timezone" },
  PlanGraceDays: { type: "int", min: 0, max: 90 },
  FallbackPlanCode: { type: "plan" },
  PlanReminderDays: { type: "days-list" },
  TrialDays: { type: "int", min: 0, max: 365 },
  TrialPlanCode: { type: "plan" },
  PaymentInstructions: { type: "textarea" },
  InvoiceDueDays: { type: "int", min: 0, max: 90 },
  NotificationMaxAttempts: { type: "int", min: 1, max: 20 },
  SmsCostPerMessage: { type: "decimal", min: 0 },
  MaintenanceMode: { type: "bool" },
  MaintenanceMessage: { type: "textarea" },
  SignupEnabled: { type: "bool" },
  MaxSignupsPerIpPerDay: { type: "int", min: 0 },
  AdminIpAllowlist: {
    type: "textarea",
    placeholder: "e.g. 203.0.113.5, 10.0.0.0/24 (empty = any IP)",
  },
  DataRetentionDaysAfterClose: { type: "int", min: 0, max: 3650 },
};

export const settingKind = (key: string): SettingKind =>
  kinds[key] ?? { type: "text" };