import { Platform } from 'react-native';
import * as webAds from './ads.web';

let nativeAds: any = null;
if (Platform.OS !== 'web') {
  try {
    // Dynamically require native module on iOS and Android
    nativeAds = require('./ads.native');
  } catch (e) {
    console.warn('Could not load native ads module:', e);
  }
}

const activeAds = (Platform.OS !== 'web' && nativeAds) ? nativeAds : webAds;

export const ADMOB_CONFIG: typeof webAds.ADMOB_CONFIG = activeAds.ADMOB_CONFIG;
export const initializeAds: typeof webAds.initializeAds = activeAds.initializeAds;
export const preloadTransactionSaveAd: typeof webAds.preloadTransactionSaveAd = activeAds.preloadTransactionSaveAd;
export const showTransactionSaveAd: typeof webAds.showTransactionSaveAd = activeAds.showTransactionSaveAd;
export const HomeBannerAd: typeof webAds.HomeBannerAd = activeAds.HomeBannerAd;
