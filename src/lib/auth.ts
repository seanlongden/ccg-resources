import { checkStripeSubscription, SubscriptionStatus } from './stripe';
import { isLifetimeMember } from './lifetime-members';

export type AccessStatus = SubscriptionStatus;

export async function checkAccess(email: string): Promise<AccessStatus> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check lifetime members first (faster, cached)
  const isLifetime = await isLifetimeMember(normalizedEmail);
  if (isLifetime) {
    return {
      hasAccess: true,
      status: 'lifetime',
    };
  }

  // Check Stripe subscription
  const stripeStatus = await checkStripeSubscription(normalizedEmail);
  return stripeStatus;
}
