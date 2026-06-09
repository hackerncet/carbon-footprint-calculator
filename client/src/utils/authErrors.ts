/**
 * Maps Firebase Auth error codes to user-friendly, clean error messages.
 * Prevents technical strings (e.g., "Firebase: Error (auth/email-already-in-use)")
 * from leaking into the user interface.
 *
 * @param err - The error object (typically from Firebase Auth). Accepts `unknown` type.
 * @returns A human-readable error message suitable for display.
 */
export function formatAuthError(err: unknown): string {
  // Safely extract code and message from unknown error
  let code = '';
  let rawMessage = '';

  if (err !== null && typeof err === 'object') {
    if ('code' in err && typeof (err as Record<string, unknown>).code === 'string') {
      code = (err as Record<string, unknown>).code as string;
    }
    if ('message' in err && typeof (err as Record<string, unknown>).message === 'string') {
      rawMessage = (err as Record<string, unknown>).message as string;
    }
  } else if (typeof err === 'string') {
    rawMessage = err;
  }

  // Attempt to extract auth code from raw message if not available directly
  if (!code && rawMessage) {
    const match = rawMessage.match(/\((auth\/[a-z0-9-]+)\)/);
    if (match) {
      code = match[1];
    }
  }

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email address is already in use. Please sign in instead, or use a different email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Your password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed sign-in attempts. Please wait a moment and try again, or reset your password.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password authentication is not enabled in the Firebase Console.';
    default:
      if (rawMessage) {
        // Strip Firebase prefix if present
        return rawMessage
          .replace(/^Firebase:\s*/i, '')
          .replace(/\s*\(auth\/.*\)\.?$/i, '')
          .trim();
      }
      return 'Authentication failed. Please verify your credentials and try again.';
  }
}
