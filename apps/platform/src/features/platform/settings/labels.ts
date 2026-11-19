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
