import type { Flow, FilterGroup } from '../../engine/types';

export const flows: Flow[] = [
  // Linear flow: trigger → email → email (3 steps, no splits)
  {
    id: 1,
    name: 'Welcome Series',
    status: 'draft',
    trigger: {
      kind: 'trigger',
      id: 'trigger_1',
      event: 'signup',
      action_name: 'Welcome Series Trigger',
    },
    steps: [
      {
        kind: 'email',
        id: 'step_1',
        subject: 'Welcome to Nitrosend!',
        body: 'Hi {{ contact.first_name | default: "there" }}, welcome aboard.',
      },
      {
        kind: 'email',
        id: 'step_2',
        subject: 'Getting Started',
        body: 'Here are three tips to get started with Nitrosend.',
      },
    ],
  },

  // Branching flow: trigger → split (2 conditions) → email (yes) / email (no) (5 steps)
  {
    id: 2,
    name: 'Engagement Split',
    status: 'draft',
    trigger: {
      kind: 'trigger',
      id: 'trigger_2',
      event: 'cart_abandoned',
      action_name: 'Cart Abandonment Trigger',
    },
    steps: [
      {
        kind: 'split',
        id: 'step_3',
        filters: {
          logic: 'or',
          conditions: [
            { name: 'contact.engagement_rating', value: 'high', predicate: 'eq' },
            { name: 'contact.engagement_rating', value: 'medium', predicate: 'eq' },
          ],
        },
        yes: [
          {
            kind: 'email',
            id: 'step_4',
            subject: 'We miss you!',
            body: 'You left something in your cart.',
          },
        ],
        no: [
          {
            kind: 'email',
            id: 'step_5',
            subject: 'Complete your purchase',
            body: 'Still thinking about it? Here is 10% off.',
          },
        ],
      },
    ],
  },

  // Multi-split flow: trigger → split → split → split → email × 4+ (8+ steps)
  {
    id: 3,
    name: 'Tiered Follow-Up',
    status: 'draft',
    trigger: {
      kind: 'trigger',
      id: 'trigger_3',
      event: 'purchase',
      action_name: 'Purchase Follow-Up Trigger',
    },
    steps: [
      {
        kind: 'split',
        id: 'step_6',
        filters: {
          logic: 'and',
          conditions: [
            { name: 'contact.tier', value: 'enterprise', predicate: 'eq' },
          ],
        },
        yes: [
          {
            kind: 'split',
            id: 'step_7',
            filters: {
              logic: 'and',
              conditions: [
                { name: 'data.order_total', value: '500', predicate: 'gt' },
              ],
            },
            yes: [
              {
                kind: 'email',
                id: 'step_8',
                subject: 'Enterprise VIP Follow-Up',
                body: 'Thank you for your large order.',
              },
            ],
            no: [
              {
                kind: 'email',
                id: 'step_9',
                subject: 'Enterprise Standard Follow-Up',
                body: 'Thank you for your purchase.',
              },
            ],
          },
        ],
        no: [
          {
            kind: 'split',
            id: 'step_10',
            filters: {
              logic: 'and',
              conditions: [
                { name: 'contact.tier', value: 'pro', predicate: 'eq' },
              ],
            },
            yes: [
              {
                kind: 'email',
                id: 'step_11',
                subject: 'Pro Member Thanks',
                body: 'Thanks for being a Pro member.',
              },
            ],
            no: [
              {
                kind: 'email',
                id: 'step_12',
                subject: 'Standard Follow-Up',
                body: 'Thanks for your order.',
              },
            ],
          },
        ],
      },
    ],
  },
];
