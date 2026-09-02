import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import Toast from 'react-native-toast-message';

export default function MaintenanceScreen() {
  const { refreshConfig } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      if (refreshConfig) {
        await refreshConfig();
      }
      Toast.show({
        type: 'info',
        text1: 'Checked System Status',
        text2: 'Maintenance is still active. Please try again shortly.',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not connect to server.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@rupeo.app?subject=Rupeo%20Maintenance%20Inquiry').catch(() => {
      Toast.show({
        type: 'info',
        text1: 'Support Email',
        text2: 'Please email us at support@rupeo.app',
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Live Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>SYSTEM UPGRADE IN PROGRESS</Text>
        </View>

        {/* Maintenance Icon Container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <Ionicons name="construct" size={48} color="#F59E0B" />
            </View>
          </View>
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>Under Scheduled Maintenance</Text>
        <Text style={styles.subtitle}>
          Rupeo is currently undergoing scheduled improvements to deliver a faster and more secure experience.
        </Text>

        {/* Information Highlights Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoRowTitle}>Data Protected & Safe</Text>
              <Text style={styles.infoRowSub}>All your transactions and balances remain 100% secure.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={18} color="#F59E0B" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoRowTitle}>Back Online Shortly</Text>
              <Text style={styles.infoRowSub}>Services will resume automatically once updates finish.</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={checking}
            activeOpacity={0.8}
          >
            {checking ? (
              <ActivityIndicator color="#0F172A" size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#0F172A" style={{ marginRight: 8 }} />
                <Text style={styles.refreshButtonText}>Check Status Again</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 28,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircleOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  infoRowSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: '#FFD740',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  supportButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
