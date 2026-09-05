import React from 'react';
import { Platform } from 'react-native';
import * as webAds from './ads.web';
import * as nativeAds from './ads.native';

export const ADMOB_CONFIG = Platform.OS === 'web' ? webAds.ADMOB_CONFIG : nativeAds.ADMOB_CONFIG;
export const initializeAds = Platform.OS === 'web' ? webAds.initializeAds : nativeAds.initializeAds;

export function preloadTransactionSaveAd(forceTest: boolean = false) {
  if (Platform.OS === 'web') {
    return webAds.preloadTransactionSaveAd();
  }
  return nativeAds.preloadTransactionSaveAd(forceTest);
}

export function showTransactionSaveAd(isUserPremium: boolean = false, onDismiss?: () => void) {
  if (Platform.OS === 'web') {
    return webAds.showTransactionSaveAd(isUserPremium, onDismiss);
  }
  return nativeAds.showTransactionSaveAd(isUserPremium, onDismiss);
}

export function HomeBannerAd(props: { style?: any }) {
  if (Platform.OS === 'web') {
    return <webAds.HomeBannerAd {...props} />;
  }
  return <nativeAds.HomeBannerAd {...props} />;
}
