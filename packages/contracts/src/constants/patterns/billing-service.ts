/**
 * Billing Service message pattern constants
 * Format: {service-name}.{action}
 */

export const BILLING_SERVICE_PATTERNS = {
  GET_SUBSCRIPTION: "billing-service.getSubscription",
  UPDATE_SUBSCRIPTION: "billing-service.updateSubscription",
  CANCEL_SUBSCRIPTION: "billing-service.cancelSubscription",
  TRACK_USAGE: "billing-service.trackUsage",
  GET_USAGE: "billing-service.getUsage",
  CHECK_LIMITS: "billing-service.checkLimits",
  LIST_INVOICES: "billing-service.listInvoices",
  GET_INVOICE: "billing-service.getInvoice",
} as const;
