import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

// Dynamically check if react-native-google-mobile-ads native binary is available (Available in compiled APK / EAS build, not in Expo Go)
let GoogleMobileAds: any = null;
try {
  GoogleMobileAds = require('react-native-google-mobile-ads');
} catch (e) {
  // Running in Expo Go client without custom native modules
}

const mobileAds = GoogleMobileAds?.default;
const BannerAd = GoogleMobileAds?.BannerAd;
const BannerAdSize = GoogleMobileAds?.BannerAdSize;
const InterstitialAd = GoogleMobileAds?.InterstitialAd;
const AdEventType = GoogleMobileAds?.AdEventType;
const TestIds = GoogleMobileAds?.TestIds;

export const ADMOB_CONFIG = {
  appId: process.env.EXPO_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-2106211536803561~5812952031',
  homeBannerId: process.env.EXPO_PUBLIC_ADMOB_HOME_BANNER_ID || 'ca-app-pub-2106211536803561/4086148848',
  transactionSaveId: process.env.EXPO_PUBLIC_ADMOB_TX_SAVE_ID || 'ca-app-pub-2106211536803561/1459985503',
};

let interstitial: any = null;
let isInterstitialLoaded = false;
let onInterstitialClosedCallback: (() => void) | null = null;

const TEST_INTERSTITIAL_ID = TestIds?.INTERSTITIAL || 'ca-app-pub-3940256099942544/1033173712';

/**
 * Initialize Google Mobile Ads SDK (Native)
 */
export async function initializeAds() {
  if (!mobileAds) return;
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
export function preloadTransactionSaveAd(forceTest: boolean = false) {
  if (!InterstitialAd || !AdEventType) return;

  const adUnitId = (forceTest || __DEV__) ? TEST_INTERSTITIAL_ID : ADMOB_CONFIG.transactionSaveId;

  try {
    interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ AdMob Interstitial loaded successfully with ID:', adUnitId);
      isInterstitialLoaded = true;
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('AdMob Interstitial closed by user');
      isInterstitialLoaded = false;
      const cb = onInterstitialClosedCallback;
      onInterstitialClosedCallback = null;
      if (cb) {
        cb();
      }
      // Preload next interstitial ad
      preloadTransactionSaveAd(forceTest);
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.warn('AdMob Interstitial failed to load with unitId:', adUnitId, error);
      isInterstitialLoaded = false;
      if (!forceTest) {
        // Fallback to Google's official test interstitial ID
        preloadTransactionSaveAd(true);
      }
    });

    interstitial.load();
  } catch (e) {
    console.warn('Could not create InterstitialAd instance:', e);
  }
}

/**
 * Show Transaction Save Ad (Interstitial) after a transaction is successfully saved
 * Skips entirely if user is a Premium subscriber!
 * Calls onDismiss() when ad is closed or if ad fails/not ready.
 */
export async function showTransactionSaveAd(
  isUserPremium: boolean = false,
  onDismiss?: () => void
): Promise<void> {
  if (isUserPremium) {
    if (onDismiss) onDismiss();
    return;
  }

  try {
    if (interstitial && isInterstitialLoaded) {
      onInterstitialClosedCallback = onDismiss || null;
      await interstitial.show();
    } else {
      console.log('Interstitial ad not ready yet, proceeding with navigation');
      preloadTransactionSaveAd();
      if (onDismiss) onDismiss();
    }
  } catch (e) {
    console.warn('Error showing Transaction Save Ad:', e);
    onInterstitialClosedCallback = null;
    if (onDismiss) onDismiss();
    preloadTransactionSaveAd();
  }
}

/**
 * Native Home Banner Ad Component
 * Hides completely when user is Premium or if ad fails to load!
 * Takes ZERO space (height: 0) while loading and vanishes on error.
 */
export function HomeBannerAd({ style }: { style?: any }) {
  const { isPremium, appConfig } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [useTestAd, setUseTestAd] = useState(__DEV__);

  const TEST_BANNER_ID = TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111';

  // If user is Premium, ads disabled by config, or native AdMob binary missing (e.g. Expo Go)
  if (isPremium || appConfig?.showAds === false || !BannerAd || !BannerAdSize) {
    return null;
  }

  // If ad failed to load completely (e.g. offline, no fill), hide area completely
  if (adError) {
    return null;
  }

  const adUnitId = useTestAd ? TEST_BANNER_ID : ADMOB_CONFIG.homeBannerId;

  return (
    <View style={[styles.bannerContainer, style, !isLoaded && styles.hiddenBanner]}>
      <BannerAd
        key={adUnitId}
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          setIsLoaded(true);
          setAdError(false);
        }}
        onAdFailedToLoad={(error: any) => {
          console.warn('AdMob Home Banner failed to load with unitId:', adUnitId, error);
          if (!useTestAd) {
            // Try fallback to Google's test ad ID
            setUseTestAd(true);
          } else {
            // Both live and test failed -> hide area completely (0 pixels)
            setAdError(true);
            setIsLoaded(false);
          }
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
  hiddenBanner: {
    height: 0,
    marginVertical: 0,
    paddingVertical: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  previewBannerContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFD740',
    letterSpacing: 0.5,
  },
  previewSponsorText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  previewContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  previewSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
});
