import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export type SubscriptionStatus = {
  hasAccess: boolean;
  status: 'active' | 'trialing' | 'canceled_with_access' | 'no_subscription' | 'lifetime';
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
};

// Type for subscription with the fields we need
type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_end: number;
  cancel_at_period_end: boolean;
};

export async function checkStripeSubscription(email: string): Promise<SubscriptionStatus> {
  try {
    // Find customer by email
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1,
    });

    if (customers.data.length === 0) {
      return { hasAccess: false, status: 'no_subscription' };
    }

    const customer = customers.data[0];

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return { hasAccess: false, status: 'no_subscription' };
    }

    // Check for active or trialing subscription
    for (const subscription of subscriptions.data) {
      const sub = subscription as SubscriptionWithPeriod;

      if (sub.status === 'active') {
        return {
          hasAccess: true,
          status: sub.cancel_at_period_end ? 'canceled_with_access' : 'active',
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      }

      if (sub.status === 'trialing') {
        return {
          hasAccess: true,
          status: 'trialing',
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      }
    }

    // Check if any canceled subscription still has time left
    for (const subscription of subscriptions.data) {
      const sub = subscription as SubscriptionWithPeriod;

      if (sub.status === 'canceled') {
        const periodEnd = new Date(sub.current_period_end * 1000);
        if (periodEnd > new Date()) {
          return {
            hasAccess: true,
            status: 'canceled_with_access',
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: true,
          };
        }
      }
    }

    return { hasAccess: false, status: 'no_subscription' };
  } catch (error) {
    console.error('Error checking Stripe subscription:', error);
    return { hasAccess: false, status: 'no_subscription' };
  }
}
