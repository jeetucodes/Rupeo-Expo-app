import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export const ADMOB_CONFIG = {
  appId: process.env.EXPO_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-2106211536803561~5812952031',
  homeBannerId: process.env.EXPO_PUBLIC_ADMOB_HOME_BANNER_ID || 'ca-app-pub-2106211536803561/4086148848',
  transactionSaveId: process.env.EXPO_PUBLIC_ADMOB_TX_SAVE_ID || 'ca-app-pub-2106211536803561/1459985503',
};

export async function initializeAds(): Promise<void> {}
export function preloadTransactionSaveAd(): void {}
export async function showTransactionSaveAd(isUserPremium: boolean = false): Promise<void> {}

export function HomeBannerAd({ style }: { style?: any }) {
  const { isPremium, appConfig } = useAuth();

  if (isPremium || appConfig?.showAds === false) {
    return null;
  }

  if (__DEV__) {
    return (
      <View style={[styles.devBannerPlaceholder, style]}>
        <Text style={styles.devBannerText}>📢 AdMob Home Banner (Hidden for Premium users)</Text>
        <Text style={styles.devBannerSub}>Unit ID: {ADMOB_CONFIG.homeBannerId}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  devBannerPlaceholder: {
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: '#FFD740',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    textAlign: 'center',
  },
  devBannerSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 2,
    textAlign: 'center',
  },
});
