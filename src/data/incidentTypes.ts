export type Category = "harassment" | "stalking" | "unsafe_area" | "theft" | "suspicious_activity" | "poor_lighting" | "other";
export type Severity = "low" | "medium" | "high" | "critical";

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: "harassment", label: "Harassment", icon: "🚨" },
  { value: "stalking", label: "Stalking", icon: "👁️" },
  { value: "unsafe_area", label: "Unsafe Area", icon: "⚠️" },
  { value: "theft", label: "Theft", icon: "💰" },
  { value: "suspicious_activity", label: "Suspicious Activity", icon: "🔍" },
  { value: "poor_lighting", label: "Poor Lighting", icon: "🌑" },
  { value: "other", label: "Other", icon: "📋" },
];

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-muted/30" },
  medium: { label: "Medium", color: "text-warning", bg: "bg-warning/10" },
  high: { label: "High", color: "text-primary", bg: "bg-primary/10" },
  critical: { label: "Critical", color: "text-danger", bg: "bg-danger/10" },
};
