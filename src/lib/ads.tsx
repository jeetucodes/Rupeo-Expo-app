import React from 'react';
import { Platform } from 'react-native';
import * as webAds from './ads.web';
import * as nativeAds from './ads.native';

export const ADMOB_CONFIG = Platform.OS === 'web' ? webAds.ADMOB_CONFIG : nativeAds.ADMOB_CONFIG;
export const initializeAds = Platform.OS === 'web' ? webAds.initializeAds : nativeAds.initializeAds;
export const preloadTransactionSaveAd = Platform.OS === 'web' ? webAds.preloadTransactionSaveAd : nativeAds.preloadTransactionSaveAd;
export const showTransactionSaveAd = Platform.OS === 'web' ? webAds.showTransactionSaveAd : nativeAds.showTransactionSaveAd;

export function HomeBannerAd(props: { style?: any }) {
  if (Platform.OS === 'web') {
    return null;
  }
  return <nativeAds.HomeBannerAd {...props} />;
}
