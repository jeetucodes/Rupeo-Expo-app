import { UserCredential } from 'firebase/auth';

export async function promptGoogleSignIn(): Promise<UserCredential> {
  throw new Error('promptGoogleSignIn is implemented in platform-specific files.');
}
