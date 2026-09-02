import { GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { auth } from './firebase';

export async function promptGoogleSignIn(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(auth, provider);
}
