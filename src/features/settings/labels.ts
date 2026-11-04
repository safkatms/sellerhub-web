/** Friendly names for known setting keys. Unknown keys fall back to a humanized version of the key. */
const labels: Record<string, string> = {
  PlatformTimeZone: "Platform time zone",
  PlanGraceDays: "Plan grace period (days)",
  FallbackPlanCode: "Fallback plan",
  PlanReminderDays: "Expiry reminder days",
  TrialDays: "Trial length (days)",
  TrialPlanCode: "Trial plan",
};

/** "SomeNewSetting" -> "Some new setting" */
const humanize = (key: string) => {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const settingLabel = (key: string) => labels[key] ?? humanize(key);
