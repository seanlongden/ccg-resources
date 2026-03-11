/**
 * Admin Configuration
 */

// Emails that have admin access
const ADMIN_EMAILS = [
  'sean@closingclients.com',
  'sean@closingclientsgroup.com',
  // Add more admin emails as needed
];

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
