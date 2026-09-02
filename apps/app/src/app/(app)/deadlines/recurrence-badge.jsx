import { Badge } from "@steuerberaterflow/ui";

const LABELS = { MONTHLY: "monatlich", QUARTERLY: "quartalsweise", YEARLY: "jährlich" };

export function RecurrenceBadge({ recurrence }) {
  return <Badge tone="blue">{LABELS[recurrence] || recurrence}</Badge>;
}
