import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Image,
  View as RNView, // ensure we don't conflict, although View is already imported
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { promptGoogleSignIn } from '@/lib/google-auth';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import {
  requestNotificationPermissions,
  sendWelcomeNotification,
  setupPeriodicSmartNotifications,
} from '@/lib/notifications';

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const ambientMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(ambientMotion, {
        toValue: 1,
        duration: 16000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [ambientMotion]);


  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const result = await promptGoogleSignIn();
      if (result?.user) {
        requestNotificationPermissions().then((granted) => {
          if (granted) {
            setupPeriodicSmartNotifications().catch(() => { });
          }
        }).catch(() => { });

        if (getAdditionalUserInfo(result)?.isNewUser) {
          await setDoc(doc(db, 'users', result.user.uid), {
            email: result.user.email,
            name: result.user.displayName || 'User',
            createdAt: new Date().toISOString(),
            starting_balance: 0,
            has_set_starting_balance: false,
          }, { merge: true });

          sendWelcomeNotification(result.user.uid).catch(() => { });
          router.replace('/setup');
        } else {
          router.replace('/(tabs)/dashboard');
        }
      }
    } catch (error: any) {
      console.warn('Google Auth Error:', error.message);
      if (error?.message !== 'GoogleSignin native module unavailable') {
        Alert.alert('Google Sign-In', error.message || 'Could not sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBFAF5" />

      {/* Animated Background Blobs */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowTopRight,
          {
            transform: [
              { translateX: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -40, 0] }) },
              { translateY: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 30, 0] }) },
              { scale: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1] }) }
            ]
          }
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowBottomLeft,
          {
            transform: [
              { translateX: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 50, 0] }) },
              { translateY: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -40, 0] }) },
              { scale: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.35, 1] }) }
            ]
          }
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowCenter,
          {
            transform: [
              { translateX: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -60, 0] }) },
              { translateY: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -20, 0] }) },
              { scale: ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.8, 1.1, 0.8] }) }
            ]
          }
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.scrollContent}>
          {/* Header Text Section */}
          <View style={styles.header}>
            <Text style={styles.title} adjustsFontSizeToFit numberOfLines={1}>Rupeo</Text>
            <Text style={styles.subtitle} adjustsFontSizeToFit numberOfLines={2}>
              Welcome back! Sign in to access your wallet.
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Google Sign In Only */}

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerInfo}>
            <Ionicons name="shield-checkmark" size={15} color="#10B981" />
            <Text style={styles.footerText}>100% Secure & Private</Text>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFAF5', // Light cream color matching your theme
  },
  glowTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(245, 158, 11, 0.18)', // Golden glow
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.12)', // Green glow
  },
  glowCenter: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.08)', // Blue glow
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 54,
    fontWeight: '900',
    color: '#2d3748',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4a5568',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    height: 64,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#edf2f7',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1a202c',
    fontSize: 18,
    fontWeight: '800',
  },
  footerInfo: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
});
