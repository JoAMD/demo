export const payloads: Record<string, unknown>[] = [
  {
    event: 'cart_abandoned',
    data: {
      cart: { total: 49.99, items: 3 },
      contact: { email: 'sam.chen@example.com' },
    },
  },
  {
    event: 'signup',
    data: {
      plan: 'pro',
      source: 'organic',
      contact: { email: 'alex.rivera@example.com' },
    },
  },
  {
    event: 'purchase',
    data: {
      order_total: 149.99,
      product_count: 5,
      contact: { email: 'jordan.kim@example.com' },
    },
  },
  {
    event: 'password_reset',
    data: {
      method: 'email',
      contact: { email: 'taylor.jones@example.com' },
    },
  },
  {
    event: 'subscription_expired',
    data: {
      plan: 'enterprise',
      expired_at: '2026-08-01T00:00:00Z',
      contact: { email: 'casey.morgan@example.com' },
    },
  },
];
