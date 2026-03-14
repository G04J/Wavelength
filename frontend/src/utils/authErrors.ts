/**
 * Map Supabase Auth error messages to user-friendly text.
 * Sign-in failures use a single generic message so we never reveal whether an email exists.
 */
export function getAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("email rate")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  // Single generic message for any credential / user-not-found style error (no email enumeration)
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("user not found") ||
    lower.includes("email not found") ||
    lower.includes("wrong password") ||
    lower.includes("incorrect password")
  ) {
    return "Invalid email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please check your inbox and confirm your email before signing in.";
  }
  return message;
}
