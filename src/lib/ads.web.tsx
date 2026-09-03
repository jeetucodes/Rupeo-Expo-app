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
  // Banner ads on Web are not supported by react-native-google-mobile-ads
  return null;
}
