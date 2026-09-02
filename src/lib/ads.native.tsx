import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import mobileAds, {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useAuth } from '@/context/AuthContext';

export const ADMOB_CONFIG = {
  appId: process.env.EXPO_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-2106211536803561~5812952031',
  homeBannerId: process.env.EXPO_PUBLIC_ADMOB_HOME_BANNER_ID || 'ca-app-pub-2106211536803561/4086148848',
  transactionSaveId: process.env.EXPO_PUBLIC_ADMOB_TX_SAVE_ID || 'ca-app-pub-2106211536803561/1459985503',
};

let interstitial: InterstitialAd | null = null;
let isInterstitialLoaded = false;

/**
 * Initialize Google Mobile Ads SDK (Native)
 */
export async function initializeAds() {
  try {
    await mobileAds().initialize();
    preloadTransactionSaveAd();
  } catch (e) {
    console.warn('Google Mobile Ads initialization warning:', e);
  }
}

/**
 * Preload the Transaction Save Interstitial Ad
 */
export function preloadTransactionSaveAd() {
  const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : ADMOB_CONFIG.transactionSaveId;

  try {
    interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      // Preload next ad
      preloadTransactionSaveAd();
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.warn('AdMob Interstitial failed to load:', error);
      isInterstitialLoaded = false;
    });

    interstitial.load();
  } catch (e) {
    console.warn('Could not create InterstitialAd instance:', e);
  }
}

/**
 * Show Transaction Save Ad (Interstitial) after a transaction is successfully saved
 * Skips entirely if user is a Premium subscriber!
 */
export async function showTransactionSaveAd(isUserPremium: boolean = false): Promise<void> {
  if (isUserPremium) {
    // Zero ads for Premium users
    return;
  }

  try {
    if (interstitial && isInterstitialLoaded) {
      await interstitial.show();
    } else {
      preloadTransactionSaveAd();
    }
  } catch (e) {
    console.warn('Error showing Transaction Save Ad:', e);
  }
}

/**
 * Native Home Banner Ad Component
 * Hides completely when user is Premium!
 */
export function HomeBannerAd({ style }: { style?: any }) {
  const { isPremium, appConfig } = useAuth();
  const [adError, setAdError] = useState(false);

  // If user is premium or Admin disabled ads, never render ads!
  if (isPremium || appConfig?.showAds === false || adError) return null;

  const adUnitId = __DEV__ ? TestIds.BANNER : ADMOB_CONFIG.homeBannerId;

  return (
    <View style={[styles.bannerContainer, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdFailedToLoad={(error: any) => {
          console.warn('AdMob Home Banner failed to load:', error);
          setAdError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    overflow: 'hidden',
    borderRadius: 12,
  },
});
