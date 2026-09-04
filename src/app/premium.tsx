import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

export default function PremiumScreen() {
  const router = useRouter();

  const handleGoHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#07090E" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoHome} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rupeo VIP</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Image
            source={{
              uri: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crown.png',
            }}
            style={{ width: 72, height: 72 }}
            contentFit="contain"
          />
        </View>

        <Text style={styles.heroTitle}>All Features Are 100% Free! 🎉</Text>
        <Text style={styles.heroSub}>
          Enjoy unlimited bill alerts, detailed financial reports, AI insights, and complete access with zero restrictions.
        </Text>

        <View style={styles.perksCard}>
          <View style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.perkText}>Unlimited Bill & Recurring Reminders</Text>
          </View>
          <View style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.perkText}>Full Multi-Page PDF Statements & CSV Export</Text>
          </View>
          <View style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.perkText}>50/30/20 Budget Rule & AI Financial Vitality</Text>
          </View>
          <View style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.perkText}>Custom Categories & 1-Tap Quick Presets</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleGoHome} style={styles.btnWrapper} activeOpacity={0.85}>
          <LinearGradient
            colors={['#FFD740', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Back to Dashboard</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD740',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  perksCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 28,
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  btnWrapper: {
    width: '100%',
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#07090E',
  },
});
