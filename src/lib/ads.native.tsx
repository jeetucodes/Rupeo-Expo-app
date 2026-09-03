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
export function preloadTransactionSaveAd(useTest: boolean = __DEV__) {
  if (!InterstitialAd || !AdEventType) return;

  const adUnitId = useTest ? TestIds?.INTERSTITIAL : ADMOB_CONFIG.transactionSaveId;

  try {
    interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      preloadTransactionSaveAd(useTest);
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.warn('AdMob Interstitial failed to load with unitId:', adUnitId, error);
      isInterstitialLoaded = false;
      if (!useTest && TestIds?.INTERSTITIAL) {
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
 */
export async function showTransactionSaveAd(isUserPremium: boolean = false): Promise<void> {
  if (isUserPremium) {
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
  const [useTestAd, setUseTestAd] = useState(__DEV__);

  // In production (!__DEV__), Premium users get 100% Zero Ads.
  // In development (__DEV__), allow displaying the ad so the developer can test and verify it!
  if (!__DEV__ && (isPremium || appConfig?.showAds === false)) return null;

  // 1. If compiled Android APK with native AdMob SDK:
  if (BannerAd && BannerAdSize) {
    if (adError) return null;

    const adUnitId = (useTestAd && TestIds?.BANNER) ? TestIds.BANNER : ADMOB_CONFIG.homeBannerId;

    return (
      <View style={[styles.bannerContainer, style]}>
        <BannerAd
          key={adUnitId}
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={() => {
            setAdError(false);
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn('AdMob Home Banner failed to load with unitId:', adUnitId, error);
            if (!useTestAd && TestIds?.BANNER) {
              setUseTestAd(true);
            } else {
              setAdError(true);
            }
          }}
        />
      </View>
    );
  }

  // 2. If running inside Expo Go (Development test banner representation):
  return (
    <View style={[styles.previewBannerContainer, style]}>
      <View style={styles.previewHeaderRow}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <Text style={styles.previewSponsorText}>Google AdMob • Test Banner</Text>
        <Ionicons name="information-circle-outline" size={14} color="#94A3B8" style={{ marginLeft: 'auto' }} />
      </View>
      <View style={styles.previewContentRow}>
        <View style={styles.previewIconCircle}>
          <Ionicons name="megaphone-outline" size={18} color="#2563EB" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.previewTitle} numberOfLines={1}>AdMob Banner Placement</Text>
          <Text style={styles.previewSubtitle} numberOfLines={1}>Real ads will serve automatically in compiled APK</Text>
        </View>
      </View>
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
