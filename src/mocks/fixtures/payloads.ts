export const payloadsByEvent: Record<string, Record<string, unknown>> = {
  signup: {
    event: 'signup',
    data: {
      plan: 'pro',
      source: 'organic',
    },
  },
  cart_abandoned: {
    event: 'cart_abandoned',
    data: {
      cart: { total: 49.99, items: 3 },
    },
  },
  purchase: {
    event: 'purchase',
    data: {
      order_total: 149.99,
      product_count: 5,
    },
  },
  password_reset: {
    event: 'password_reset',
    data: {
      method: 'email',
    },
  },
  subscription_expired: {
    event: 'subscription_expired',
    data: {
      plan: 'enterprise',
      expired_at: '2026-08-01T00:00:00Z',
    },
  },
};

// Backward compat — ordered list for initial load
export const payloads = Object.values(payloadsByEvent);
