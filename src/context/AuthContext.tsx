import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getStartingBalanceProfile, getUserSettings, saveUserSettings, setPremiumStatus, UserSettings } from '@/lib/database';

export interface AppConfig {
  showProFeatures: boolean;
  showAds: boolean;
  maintenanceMode: boolean;
}

interface AuthContextType {
  user: RupeoUser | null;
  loading: boolean;
  settings: UserSettings | null;
  isPremium: boolean;
  appConfig: AppConfig;
  setSettings: (settings: UserSettings) => void;
  refreshSettings: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  upgradeToPremium: (plan?: 'monthly' | '3_months' | '6_months' | 'yearly' | 'lifetime' | string) => Promise<void>;
  downgradeFromPremium: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface RupeoUser extends User {
  startingBalance: number;
  hasSetStartingBalance: boolean;
  isPremium?: boolean;
  premiumPlan?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  settings: null,
  isPremium: false,
  appConfig: {
    showProFeatures: true,
    showAds: true,
    maintenanceMode: false,
  },
  setSettings: () => {},
  refreshSettings: async () => {},
  refreshUser: async () => {},
  refreshConfig: async () => {},
  upgradeToPremium: async () => {},
  downgradeFromPremium: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<RupeoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // Real-time Admin Config State
  const [appConfig, setAppConfig] = useState<AppConfig>({
    showProFeatures: true,
    showAds: true,
    maintenanceMode: false,
  });

  // Listen to Admin Toggles from Firestore (Live Real-time)
  useEffect(() => {
    if (!db) return;
    const unsubConfig = onSnapshot(
      doc(db, 'app_config', 'global'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setAppConfig({
            showProFeatures: d.showProFeatures !== false,
            showAds: d.showAds !== false,
            maintenanceMode: Boolean(d.maintenanceMode),
          });
        }
      },
      (err) => {
        console.warn('App config real-time listener error:', err);
      }
    );
    return () => unsubConfig();
  }, []);

  const refreshConfig = async () => {
    if (!db) return;
    try {
      const snap = await getDoc(doc(db, 'app_config', 'global'));
      if (snap.exists()) {
        const d = snap.data();
        setAppConfig({
          showProFeatures: d.showProFeatures !== false,
          showAds: d.showAds !== false,
          maintenanceMode: Boolean(d.maintenanceMode),
        });
      }
    } catch (e) {
      console.warn('Error refreshing app config:', e);
    }
  };

  const fetchUserProfile = async (currentUser: User) => {
    try {
      if (db && currentUser?.uid) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const balanceProfile = await getStartingBalanceProfile(currentUser.uid);
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            ...currentUser,
            displayName: data.name || data.displayName || currentUser.displayName,
            photoURL: data.photoURL || currentUser.photoURL,
            email: currentUser.email,
            phone: data.phone || '',
            defaultPaymentMode: data.defaultPaymentMode || 'UPI',
            startingBalance: balanceProfile.startingBalance,
            hasSetStartingBalance: balanceProfile.hasSetStartingBalance,
            isPremium: Boolean(data.is_premium),
            premiumPlan: data.premium_plan,
          } as any;
        }
        return {
          ...currentUser,
          startingBalance: balanceProfile.startingBalance,
          hasSetStartingBalance: balanceProfile.hasSetStartingBalance,
          isPremium: false,
        } as RupeoUser;
      }
    } catch (err) {
      console.warn('Error fetching Firestore user profile:', err);
    }
    return {
      ...currentUser,
      startingBalance: 0,
      hasSetStartingBalance: true,
      isPremium: false,
    } as RupeoUser;
  };

  const fetchSettings = async (currentUser: User) => {
    try {
      const userSettings = await getUserSettings(currentUser.uid);
      setSettings(userSettings);
    } catch (error) {
      setSettings(null);
      console.warn('Could not load settings; using defaults.', error);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const profileUser = await fetchUserProfile(currentUser);
        setUser(profileUser);
        await fetchSettings(currentUser);
      } else {
        setUser(null);
        setSettings(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshSettings = async () => {
    if (user) {
      await fetchSettings(user);
    }
  };

  const refreshUser = async () => {
    if (auth?.currentUser) {
      try {
        await auth.currentUser.reload();
      } catch (e) {
        console.warn('Auth reload error:', e);
      }
      const profileUser = await fetchUserProfile(auth.currentUser);
      setUser(profileUser);
    }
  };

  const upgradeToPremium = async (plan: 'monthly' | '3_months' | '6_months' | 'yearly' | 'lifetime' | string = 'lifetime') => {
    if (!user?.uid) return;
    try {
      await setPremiumStatus(user.uid, true, plan);
      setSettings(prev => prev ? { ...prev, isPremium: true, premiumPlan: plan } : { language: 'English', currency: '₹', isPremium: true, premiumPlan: plan });
      setUser(prev => prev ? { ...prev, isPremium: true, premiumPlan: plan } : null);
    } catch (e) {
      console.error('Failed to upgrade to premium:', e);
      throw e;
    }
  };

  const downgradeFromPremium = async () => {
    if (!user?.uid) return;
    try {
      await setPremiumStatus(user.uid, false);
      setSettings(prev => prev ? { ...prev, isPremium: false } : null);
      setUser(prev => prev ? { ...prev, isPremium: false } : null);
    } catch (e) {
      console.error('Failed to downgrade from premium:', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // All premium features 100% free and unlocked for all users
  const isPremiumUser = true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        settings,
        isPremium: isPremiumUser,
        appConfig,
        setSettings,
        refreshSettings,
        refreshUser,
        refreshConfig,
        upgradeToPremium,
        downgradeFromPremium,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
