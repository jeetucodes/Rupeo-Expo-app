import React from 'react';

export const ADMOB_CONFIG = {
  appId: process.env.EXPO_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-2106211536803561~5812952031',
  homeBannerId: process.env.EXPO_PUBLIC_ADMOB_HOME_BANNER_ID || 'ca-app-pub-2106211536803561/4086148848',
  transactionSaveId: process.env.EXPO_PUBLIC_ADMOB_TX_SAVE_ID || 'ca-app-pub-2106211536803561/1459985503',
};

export async function initializeAds(): Promise<void> {}
export function preloadTransactionSaveAd(): void {}
export async function showTransactionSaveAd(isUserPremium: boolean = false, onDismiss?: () => void): Promise<void> {
  if (onDismiss) onDismiss();
}

export function HomeBannerAd(_props: { style?: any }) {
  // Completely hidden on web — takes 0 space
  return null;
}
