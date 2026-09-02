import "server-only";

/**
 * Stripe-Adapter (Phase 3, vorbereitet).
 * Im MVP werden Abonnements nicht abgerechnet; die Tarifdaten liegen an der
 * Subscription. Erst bei Konfiguration von STRIPE_SECRET_KEY aktiviert –
 * keine Funktionalität wird simuliert, die nicht existiert.
 */

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

export async function ensureCustomer({ organization }) {
  if (!stripeConfigured) return { configured: false };
  // Vorbereitet: Customer anlegen/upsert über Stripe REST API.
  return { configured: true, customerId: organization.id };
}
