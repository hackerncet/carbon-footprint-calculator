import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';

/** Representation of the authenticated user in the client. */
interface AppUser {
  uid: string;
  email: string;
  displayName: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
}

/** Shape of the AuthContext value. */
interface AuthContextType {
  /** Current user or null if not authenticated. */
  user: AppUser | null;
  /** True while the initial auth state is being determined. */
  loading: boolean;
  /** True when Firebase is not configured (local dev mode). */
  isDevMode: boolean;
  /** Retrieves a Firebase ID token for API requests. */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  /** Signs in with email and password. */
  login: (email: string, password: string) => Promise<void>;
  /** Creates a new account and sends email verification. */
  signup: (email: string, password: string) => Promise<void>;
  /** Signs out the current user. */
  logout: () => Promise<void>;
  /** Sends a verification email to the current user. */
  sendVerification: () => Promise<void>;
  /** Reloads the current Firebase user to refresh email verification status. */
  reloadUser: () => Promise<void>;
  /** Signs in with Google via popup. */
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let auth: Auth | null = null;
let isFirebaseConfigured = false;

// Initialize Firebase if credentials exist in Vite env variables
if (
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    isFirebaseConfigured = true;
  } catch (error) {
    console.error('Failed to initialize Firebase Auth client SDK:', error);
  }
}

/**
 * Provides authentication state and actions to the component tree.
 * Supports both Firebase Auth (production) and mock auth (local dev).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      return onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName,
            avatarUrl: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } else {
      // Local Developer mock authentication fallback
      const savedMockUser = localStorage.getItem('mock_user');
      if (savedMockUser) {
        try {
          setUser(JSON.parse(savedMockUser) as AppUser);
        } catch {
          localStorage.removeItem('mock_user');
        }
      } else {
        const defaultMock: AppUser = {
          uid: 'dev-mock-uid-123',
          email: 'dev-mock@example.com',
          displayName: 'Eco Developer',
          emailVerified: true,
        };
        setUser(defaultMock);
        localStorage.setItem('mock_user', JSON.stringify(defaultMock));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      const mockUser: AppUser = {
        uid: `dev-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
        email,
        displayName: email.split('@')[0],
        avatarUrl: null,
        emailVerified: true,
      };
      setUser(mockUser);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
    }
  };

  const signup = async (email: string, password: string) => {
    if (isFirebaseConfigured && auth) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
      }
    } else {
      const mockUser: AppUser = {
        uid: `dev-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
        email,
        displayName: email.split('@')[0],
        avatarUrl: null,
        emailVerified: true,
      };
      setUser(mockUser);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      setUser(null);
      localStorage.removeItem('mock_user');
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } else {
      const mockUser: AppUser = {
        uid: 'dev-google-mock-uid-999',
        email: 'google-dev@example.com',
        displayName: 'Google Mock Dev',
        avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
        emailVerified: true,
      };
      setUser(mockUser);
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
    }
  };

  const getIdToken = async (forceRefresh = false): Promise<string | null> => {
    if (isFirebaseConfigured && auth && auth.currentUser) {
      return auth.currentUser.getIdToken(forceRefresh);
    }
    return 'mock-developer-jwt-token';
  };

  const sendVerification = async () => {
    if (isFirebaseConfigured && auth && auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const reloadUser = async () => {
    if (isFirebaseConfigured && auth && auth.currentUser) {
      await auth.currentUser.reload();
      const fbUser = auth.currentUser;
      
      // Force token refresh if verified to update claims
      if (fbUser.emailVerified) {
        await fbUser.getIdToken(true);
      }

      setUser({
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName,
        avatarUrl: fbUser.photoURL,
        emailVerified: fbUser.emailVerified,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDevMode: !isFirebaseConfigured,
        getIdToken,
        login,
        signup,
        logout,
        sendVerification,
        reloadUser,
        loginWithGoogle,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to consume the authentication context.
 * @throws {Error} If used outside of an `AuthProvider`.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
