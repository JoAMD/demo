export const payloads: Record<string, unknown>[] = [
  {
    event: 'cart_abandoned',
    data: {
      cart: { total: 49.99, items: 3 },
    },
  },
  {
    event: 'signup',
    data: {
      plan: 'pro',
      source: 'organic',
    },
  },
  {
    event: 'purchase',
    data: {
      order_total: 149.99,
      product_count: 5,
    },
  },
  {
    event: 'password_reset',
    data: {
      method: 'email',
    },
  },
  {
    event: 'subscription_expired',
    data: {
      plan: 'enterprise',
      expired_at: '2026-08-01T00:00:00Z',
    },
  },
];
